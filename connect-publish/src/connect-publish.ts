import path from 'path'
import { URL } from 'url'

import * as core from '@actions/core'
import style from 'ansi-styles'

import * as rsconnect from '@rstudio/rsconnect-ts'

function bold (txt: string, color?: style.CSPair): string {
  const c = (
    color !== null && color !== undefined
      ? color
      : style.white
  )
  return [
    c.open,
    style.modifier.bold.open,
    txt,
    style.reset.close
  ].join('')
}

export interface ActionArgs {
  accessType: string
  apiKey: string
  dirs: string[]
  force: boolean
  url: string
}

export type Success = boolean | 'SKIP'

export interface ConnectPublishResult {
  dir: string
  url: string
  success: Success
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

  return await publishFromDirs(client, args.dirs, args.force, args.accessType)
    .then((results: ConnectPublishResult[]) => {
      core.info(`\n${bold('connect-publish results', style.blue)}${bold(':')}`)
      results.forEach((res: ConnectPublishResult) => {
        let successColor: style.CSPair
        let successChar: string
        switch (res.success) {
          case true:
            successColor = style.green
            successChar = '✔'
            break
          case 'SKIP':
            successColor = style.yellow
            successChar = 'SKIP'
            break
          default:
            successColor = style.red
            successChar = '✘'
            break
        }

        core.info('  ' + ([
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

async function publishFromDirs (
  client: rsconnect.APIClient,
  dirs: string[],
  force?: boolean,
  accessType?: string
): Promise<ConnectPublishResult[]> {
  const ret: ConnectPublishResult[] = []
  const deployer = new rsconnect.Deployer(client)
  for (const dir of dirs) {
    ret.push(await publishFromDir(client, deployer, dir, force, accessType))
  }
  return ret
}

async function publishFromDir (
  client: rsconnect.APIClient,
  deployer: rsconnect.Deployer,
  dir: string,
  force?: boolean,
  accessType?: string
): Promise<ConnectPublishResult> {
  let dirName = dir
  let appPath: string | undefined

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
    appPath = parts[1]
  }

  if (appPath === undefined) {
    appPath = rsconnect.ApplicationPather.strictAppPath(dirName)
    core.debug(`strict path=${JSON.stringify(appPath)} derived from dir=${JSON.stringify(dirName)}`)
  }

  core.debug([
    'publishing',
    `dir=${JSON.stringify(dirName)}`,
    `path=${JSON.stringify(appPath)}`,
    `force=${JSON.stringify(force)}`,
    `accessType=${JSON.stringify(accessType)}`
  ].join(' '))

  return await deployer.deployManifest(
    path.join(dirName, 'manifest.json'),
    appPath,
    force,
    accessType
  ).then((resp: rsconnect.DeployTaskResponse): {
    resp: rsconnect.DeployTaskResponse
    poller: rsconnect.ClientTaskPoller
  } => {
    let publishing = 'publishing'
    let why = ''
    if (resp.noOp) {
      publishing = bold('skipping publishing', style.yellow)
      why = ' (up to date)'
    }
    core.info([
      `${publishing} ${bold(dirName)} to ${bold(resp.appUrl)}${why}`,
      `     id: ${bold(resp.appId.toString())}`,
      `   guid: ${bold(resp.appGuid)}`,
      `  title: ${bold(resp.title)}`
    ].join('\n'))

    return {
      resp,
      poller: new rsconnect.ClientTaskPoller(client, resp.taskId)
    }
  })
    .then(async ({ resp, poller }: {
      resp: rsconnect.DeployTaskResponse
      poller: rsconnect.ClientTaskPoller
    }): Promise<ConnectPublishResult> => {
      let success: Success = resp.noOp ? 'SKIP' : true
      for await (const result of poller.poll()) {
        core.debug(`received poll result: ${JSON.stringify(result)}`)
        for (const line of result.status) {
          core.info(line)
        }
        if (result.type === 'build-failed-error') {
          success = false
        }
      }
      return {
        dir: dirName,
        url: resp.appUrl,
        success
      }
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.error(err as Error)
      return {
        dir: dirName,
        url: '',
        success: false
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

  const dirs = core.getInput('dir').split('\n').map(s => s.trim()).filter(s => s !== '')
  if (dirs.length === 0) {
    dirs.push('.')
  }

  const force = ['true', 'yes', 'ok', 'on'].includes(core.getInput('force').toLowerCase().trim())
  const accessType = core.getInput('access-type').toLowerCase().trim()

  return {
    apiKey,
    dirs,
    url: url.toString(),
    force,
    accessType
  }
}
