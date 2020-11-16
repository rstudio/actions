import * as core from '@actions/core'

class ActionArgs {
  public rsconnectPythonVersion: string = ''
}

export async function setupConnect (args: ActionArgs): Promise<void> {
  // TODO: install rsconnect-python at specified version into tool
  // cache
}

export function loadArgs (): ActionArgs {
  const rsconnectPythonVersion = core.getInput('rsconnect-python-version')
  const args = new ActionArgs()
  args.rsconnectPythonVersion = rsconnectPythonVersion ? rsconnectPythonVersion : 'latest'
  return args
}
