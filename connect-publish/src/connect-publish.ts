import { URL } from 'url'
import * as core from '@actions/core'

class ActionArgs {
  public apiKey: string = ''
  public directory: string = ''
  public serverName: string = ''
  public contentType: string = ''
  public url: string = ''
}

export async function connectPublish (args: ActionArgs): Promise<void> {
  // TODO: ensure server and then publish
}

export function loadArgs (): ActionArgs {
  const rawURL = core.getInput('url', { required: true })
  const serverName = core.getInput('server-name')

  let apiKey = core.getInput('api-key')
  const apiKeySpecified = apiKey !== ''

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

  const args = new ActionArgs()

  args.apiKey = apiKey
  args.contentType = core.getInput('type')
  args.directory = core.getInput('directory')
  args.url = url.toString()
  args.serverName = serverName ?? 'default'

  return args
}
