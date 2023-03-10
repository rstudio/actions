import path from 'path'
import { URL } from 'url'

import * as core from '@actions/core'
import styles, { CSPair } from 'ansi-styles'

import * as rsconnect from '@rstudio/rsconnect-ts'

function bold (txt: string, color?: CSPair): string {
  const c = (
    color !== null && color !== undefined
      ? color
      : styles.white
  )
  return [
    c.open,
    styles.modifier.bold.open,
    txt,
    styles.reset.close
  ].join('')
}

export interface ActionArgs {
  accessType?: string
  apiKey: string
  dirs: string[]
  force: boolean
  ns?: string
  requireVanityPath: boolean
  showLogs: boolean
  updateEnv: boolean
  url: string
  workingDirectory: string
}

interface publishArgs {
  accessType?: string
  client: rsconnect.APIClient
  dirs: string[]
  force: boolean
  ns?: string
  requireVanityPath: boolean
  showLogs: boolean
  updateEnv: boolean
}

interface deployPollingResult {
  envUpdater: rsconnect.EnvironmentUpdater
  resp: rsconnect.DeployTaskResponse
  poller: rsconnect.ClientTaskPoller
  showLogs: boolean
  updateEnv: boolean
}

export type Success = boolean | 'SKIP'

export interface ConnectPublishResult {
  dir: string
  id: number
  success: Success
  url: string
}

export class ConnectPublishErrorResult extends Error {
  results: ConnectPublishResult[]

  constructor (msg: string, results: ConnectPublishResult[]) {
    super(msg)
    this.results = results
  }
}

export async function connectPublish (args: ActionArgs): Promise<ConnectPublishResult[]> {
  const baseURL = `${args.url.replace(/\/+$/, '')}/__api__`
  core.debug(`using base URL ${baseURL}`)

  const client = new rsconnect.APIClient({ apiKey: args.apiKey, baseURL })
  await client.serverSettings()

  const { accessType, dirs, force, ns, requireVanityPath, showLogs, updateEnv, workingDirectory } = args

  process.chdir(workingDirectory)

  return await publishFromDirs({
    accessType, client, dirs, force, ns, requireVanityPath, showLogs, updateEnv
  })
    .then((results: ConnectPublishResult[]) => {
      core.info(`\n${bold('connect-publish results', styles.blue)}${bold(':')}`)
      results.forEach((res: ConnectPublishResult) => {
        let successColor: CSPair
        let successChar: string
        switch (res.success) {
          case true:
            successColor = styles.green
            successChar = '✔'
            break
          case 'SKIP':
            successColor = styles.yellow
            successChar = 'SKIP'
            break
          default:
            successColor = styles.red
            successChar = '✘'
            break
        }

        core.info('  ' + ([
          `    id: ${bold(res.id.toString())}`,
          `   dir: ${bold(res.dir)}`,
          `   url: ${bold(res.url)}`,
          `status: ${bold(successChar, successColor)}`
        ].join('\n  ') + '\n'))
      })

      const failed = results.filter((res: ConnectPublishResult) => res.success === false)
      if (failed.length > 0) {
        const failedDirs = failed.map((res: ConnectPublishResult) => res.dir)
        throw new ConnectPublishErrorResult(
          `unsuccessful publish of dirs=${failedDirs.join(', ')}`,
          results
        )
      }
      core.setOutput('results', JSON.stringify(results))
      return results
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.setFailed(err as Error)
      core.setOutput('results', JSON.stringify([]))
      return err.results
    })
}

async function publishFromDirs ({
  accessType, client, dirs, force, ns, requireVanityPath, showLogs, updateEnv
}: publishArgs): Promise<ConnectPublishResult[]> {
  const ret: ConnectPublishResult[] = []
  const deployer = new rsconnect.Deployer(client)
  const envUpdater = new rsconnect.EnvironmentUpdater(client)
  for (const dir of dirs) {
    ret.push(await publishFromDir(
      deployer, envUpdater, dir,
      { accessType, client, dirs: [], force, ns, requireVanityPath, showLogs, updateEnv }
    ))
  }
  return ret
}

async function publishFromDir (
  deployer: rsconnect.Deployer,
  envUpdater: rsconnect.EnvironmentUpdater,
  dir: string,
  { accessType, client, force, ns, requireVanityPath, showLogs, updateEnv }: publishArgs
): Promise<ConnectPublishResult> {
  let dirName = dir
  let appIdentifier: string | undefined

  if (dir.match(/[^:]+:[^:]+/) !== null) {
    const parts = dir.split(/:/)
    if (parts.length !== 2) {
      core.warning([
        'discarding trailing value',
        JSON.stringify(parts.slice(2).join(':')),
        'from dir',
        JSON.stringify(dir)
      ].join(' '))
    }
    dirName = parts[0]
    appIdentifier = parts[1]
  }

  if (appIdentifier === undefined) {
    appIdentifier = rsconnect.ApplicationPather.strictAppPath(dirName)
    core.debug(`strict path=${JSON.stringify(appIdentifier)} derived from dir=${JSON.stringify(dirName)}`)
  }

  if (ns !== undefined) {
    core.debug([
      'prefixing',
      `path=${JSON.stringify(appIdentifier)}`,
      'with',
      `namespace=${JSON.stringify(ns)}`
    ].join(' '))

    appIdentifier = rsconnect.ApplicationPather.strictAppPath([ns, appIdentifier].join('/'))
  }

  core.debug([
    'publishing',
    `dir=${JSON.stringify(dirName)}`,
    `path=${JSON.stringify(appIdentifier)}`,
    `force=${JSON.stringify(force)}`,
    `accessType=${JSON.stringify(accessType)}`
  ].join(' '))

  return await deployer.deployManifest({
    accessType,
    appIdentifier,
    force,
    manifestPath: path.join(dirName, 'manifest.json'),
    requireVanityPath
  }).then((resp: rsconnect.DeployTaskResponse): deployPollingResult => {
    let publishing = 'publishing'
    let why = ''
    if (resp.noOp) {
      publishing = bold('skipping publishing', styles.yellow)
      why = ' (up to date)'
    }
    core.info([
      `${publishing} ${bold(dirName)} to ${bold(resp.appUrl)}${why}`,
      `     id: ${bold(resp.appId.toString())}`,
      `   name: ${bold(resp.appName.toString())}`,
      `   guid: ${bold(resp.appGuid)}`,
      `  title: ${bold(resp.title)}`
    ].join('\n'))

    return {
      envUpdater,
      poller: new rsconnect.ClientTaskPoller(client, resp.taskId),
      resp,
      showLogs,
      updateEnv
    }
  })
    .then(async ({ envUpdater, poller, resp, showLogs, updateEnv }: deployPollingResult): Promise<ConnectPublishResult> => {
      let success: Success = resp.noOp ? 'SKIP' : true
      for await (const result of poller.poll()) {
        core.debug(`received poll result: ${JSON.stringify(result)}`)
        for (const line of result.status) {
          if (showLogs) {
            core.info(line)
          }
        }
        if (result.type === 'build-failed-error') {
          success = false
        }
      }

      if (updateEnv) {
        core.debug([
          'updating environment',
          `dir=${dirName}`,
          `id=${resp.appId}`
        ].join(' '))

        const env = await envUpdater.updateAppEnvironment(resp.appId, dirName)
        if (env.size === 0) {
          core.debug([
            'no environment variables updated for',
            `dir=${dirName}`,
            `id=${resp.appId}`
          ].join(' '))
        } else {
          for (const key of env.keys()) {
            core.debug([
              'updated environment',
              `variable=${JSON.stringify(key)}`,
              `id=${resp.appId}`,
              `dir=${dirName}`
            ].join(' '))
          }
        }
      }

      return {
        dir: dirName,
        id: resp.appId,
        success,
        url: resp.appUrl
      }
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.error(err as Error)
      return {
        dir: dirName,
        id: -1,
        success: false,
        url: ''
      }
    })
}

export function loadArgs (): ActionArgs {
  let apiKey = core.getInput('api-key')
  const apiKeySpecified = apiKey !== ''

  const rawURL = core.getInput('url', { required: true })
  const url = new URL(rawURL)
  if (url.password !== '') {
    if (apiKeySpecified) {
      core.debug('using api key from URL password instead of api-key input')
    }
    apiKey = url.password
  } else if (url.username !== '') {
    if (apiKeySpecified) {
      core.debug('using api key from URL username instead of api-key input')
    }
    apiKey = url.username
  }
  url.password = ''
  url.username = ''

  const workingDirectory = core.getInput('working-directory')

  const dirs = core.getInput('dir').split('\n').map(s => s.trim()).filter(s => s !== '')
  if (dirs.length === 0) {
    dirs.push('.')
  }

  const force = asBool(core.getInput('force'))
  const showLogs = asBool(core.getInput('show-logs'))
  const updateEnv = asBool(core.getInput('update-env'))
  const requireVanityPath = asBool(core.getInput('require-vanity-path'))

  let accessType: string | undefined = core.getInput('access-type').toLowerCase().trim()
  if (accessType === '') {
    accessType = undefined
  } else if (!['all', 'logged_in', 'acl'].includes(accessType)) {
    core.warning(`ignoring invalid value for access-type: ${JSON.stringify(accessType)}`)
    accessType = undefined
  }

  let ns: string | undefined = core.getInput('namespace').toLowerCase().trim()
  if (ns === '') {
    ns = undefined
  }

  return {
    accessType,
    apiKey,
    dirs,
    force,
    ns,
    requireVanityPath,
    showLogs,
    updateEnv,
    url: url.toString(),
    workingDirectory
  }
}

function asBool (s: string): boolean {
  const trimmed = s.toLowerCase().trim()
  if (trimmed === '') {
    return false
  }
  try {
    return JSON.parse(trimmed)
  } catch (err: any) {
    core.debug([
      'could not parse',
      JSON.stringify(trimmed),
      'as boolean',
      `err=${JSON.stringify(err)}`
    ].join(' '))
    return false
  }
}
