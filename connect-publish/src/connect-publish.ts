import { URL } from 'url'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

class ActionArgs {
  public apiKey: string = ''
  public dirs: string[] = []
  public serverName: string = ''
  public url: string = ''
}

export async function connectPublish (args: ActionArgs): Promise<any> {
  return await addServer(args).then((rc: number) => {
    if (rc !== 0) {
      throw new Error('non-zero exit from rsconnect add')
    }
  })
    .then(async () => await publishFromDirs(args.dirs, args.serverName))
    .then((rcs: number[]) => {
      if (rcs.some((rc: number) => rc !== 0)) {
        throw new Error('non-zero exit from at least one publish')
      }
    })
    .catch((err: any) => {
      core.setFailed(err)
    })
}

async function addServer (args: ActionArgs): Promise<number> {
  return await exec.exec('rsconnect', [
    'add',
    '--name', args.serverName,
    '--server', args.url,
    '--api-key', args.apiKey
  ], { silent: true })
}

async function publishFromDirs (dirs: string[], serverName: string): Promise<number[]> {
  const ret: number[] = []
  for (const dir of dirs) {
    ret.push(await publishFromDir(dir, serverName))
  }
  return ret
}

async function publishFromDir (dir: string, serverName: string): Promise<number> {
  return await exec.exec('rsconnect', [
    'deploy',
    'manifest',
    '--name', serverName,
    dir
  ])
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

  console.log('args=%o', args)
  return args
}
