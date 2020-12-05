import path from 'path'
import { URL } from 'url'
import * as core from '@actions/core'
import * as rsconnect from '@meatballhat-rstudio/rsconnect-ts'

export interface ActionArgs {
  apiKey: string
  dirs: string[]
  url: string
}

export interface ConnectPublishResult {
  dir: string
  success: boolean
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

  return await publishFromDirs(client, args.dirs)
    .then((results: ConnectPublishResult[]) => {
      const failed = results.filter((res: ConnectPublishResult) => !res.success)
      if (failed.length > 0) {
        const failedDirs = failed.map((res: ConnectPublishResult) => res.dir)
        throw new ConnectPublishErrorResult(
          `unsuccessful publish of dirs=${failedDirs.join(', ')}`,
          results
        )
      }
      return results
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.setFailed(err as Error)
      return err.results
    })
}

async function publishFromDirs (client: rsconnect.APIClient, dirs: string[]): Promise<ConnectPublishResult[]> {
  const ret: ConnectPublishResult[] = []
  const deployer = new rsconnect.Deployer(client)
  for (const dir of dirs) {
    ret.push(await publishFromDir(client, deployer, dir))
  }
  return ret
}

async function publishFromDir (client: rsconnect.APIClient, deployer: rsconnect.Deployer, dir: string): Promise<ConnectPublishResult> {
  core.debug(`publishing dir ${dir}`)
  return await deployer.deployManifest(path.join(dir, 'manifest.json'), dir)
    .then((resp: rsconnect.DeployTaskResponse) => {
      return new rsconnect.ClientTaskPoller(client, resp.taskId)
    })
    .then(async (poller: rsconnect.ClientTaskPoller) => {
      let success = true
      for await (const result of poller.poll()) {
        core.debug(`received poll result: ${JSON.stringify(result)}`)
        for (const line of result.status) {
          core.info(line)
        }
        if (result.type === 'build-failed-error') {
          success = false
        }
      }
      return { dir, success }
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.error(err as Error)
      return { dir, success: false }
    })
}

export function loadArgs (): ActionArgs {
  let apiKey = core.getInput('api-key')
  const apiKeySpecified = apiKey !== ''

  const rawURL = core.getInput('url', { required: true })
  const url = new URL(rawURL)
  if (url.password !== '') {
    if (apiKeySpecified) {
      core.info('using api key from URL password instead of api-key input')
    }
    apiKey = url.password
  } else if (url.username !== '') {
    if (apiKeySpecified) {
      core.info('using api key from URL username instead of api-key input')
    }
    apiKey = url.username
  }
  url.password = ''
  url.username = ''

  const dirs = core.getInput('dir').split('\n').map(s => s.trim()).filter(s => s !== '')
  if (dirs.length === 0) {
    dirs.push('.')
  }

  return {
    apiKey,
    dirs,
    url: url.toString()
  }
}
