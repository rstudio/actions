import path from 'path'
import { URL } from 'url'
import * as core from '@actions/core'
import * as rsconnect from '@meatballhat-rstudio/rsconnect-ts'

class ActionArgs {
  public apiKey: string = ''
  public dirs: string[] = []
  public serverName: string = ''
  public url: string = ''
}

interface publishResult {
  dir: string
  success: boolean
}

export async function connectPublish (args: ActionArgs): Promise<any> {
  const baseURL = `${args.url.replace(/\/+$/, '')}/__api__`
  core.debug(`using base URL ${baseURL}`)

  const client = new rsconnect.APIClient({ apiKey: args.apiKey, baseURL })
  await client.serverSettings()

  return await publishFromDirs(client, args.dirs)
    .then((results: publishResult[]) => {
      const failed = results.filter((res: publishResult) => !res.success)
      if (failed.length > 0) {
        const failedDirs = failed.map((res: publishResult) => res.dir)
        throw new Error(`unsuccessful publish of dirs=${failedDirs.join(', ')}`)
      }
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.setFailed(err)
    })
}

async function publishFromDirs (client: rsconnect.APIClient, dirs: string[]): Promise<publishResult[]> {
  const ret: publishResult[] = []
  const deployer = new rsconnect.Deployer(client)
  for (const dir of dirs) {
    ret.push(await publishFromDir(client, deployer, dir))
  }
  return ret
}

async function publishFromDir (client: rsconnect.APIClient, deployer: rsconnect.Deployer, dir: string): Promise<publishResult> {
  core.debug(`publishing dir ${dir}`)
  return await deployer.deployManifest(path.join(dir, 'manifest.json'), dir)
    .then((resp: rsconnect.DeployTaskResponse) => {
      return new rsconnect.ClientTaskPoller(client, resp.taskId)
    })
    .then(async (poller: rsconnect.ClientTaskPoller) => {
      for await (const result of poller.poll()) {
        for (const line of result.status) {
          core.info(line)
        }
      }
      return {
        dir,
        success: true
      }
    })
    .catch((err: any) => {
      if (core.isDebug()) {
        console.trace(err)
      }
      core.error(err as Error)
      return {
        dir,
        success: false
      }
    })
}

export function loadArgs (): ActionArgs {
  let serverName = core.getInput('server-name')
  if (serverName === '' || serverName === undefined || serverName === null) {
    serverName = 'default'
  }

  let apiKey = core.getInput('api-key')
  const apiKeySpecified = apiKey !== ''

  const rawURL = core.getInput('url', { required: true })
  const url = new URL(rawURL)
  if (url.password !== '') {
    if (apiKeySpecified) {
      core.warning('using api key from URL password instead of api-key input')
    }
    apiKey = url.password
  } else if (url.username !== '') {
    if (apiKeySpecified) {
      core.warning('using api key from URL username instead of api-key input')
    }
    apiKey = url.username
  }
  url.password = ''
  url.username = ''

  const dirs = core.getInput('dir').split('\n').map(s => s.trim()).filter(s => s !== '')
  if (dirs.length === 0) {
    dirs.push('.')
  }

  const args = new ActionArgs()

  args.apiKey = apiKey
  args.dirs = dirs
  args.serverName = serverName
  args.url = url.toString()

  return args
}
