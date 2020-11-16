import * as core from '@actions/core'
import * as exec from '@actions/exec'

class ActionArgs {
  public version: string = ''
}

const errInstallPython = [
  'Please ensure python is available, such as by running a',
  'step with "uses: actions/setup-python@v2" prior to this step.'
].join(' ')

export async function setupConnect (args: ActionArgs): Promise<any> {
  // TODO: install rsconnect-python at specified version into tool cache
  let spec = 'rsconnect-python'
  if (args.version !== 'latest') {
    spec = `${spec}==${args.version}`
  }

  return await exec.exec('python', ['--version'])
    .then(async () => await exec.exec('python', ['-m', 'ensurepip', '--default-pip']))
    .then(async () => await exec.exec('python', ['-m', 'pip', 'install', spec]))
    .then(() => {
      core.info('installed rsconnect-python, which is available as "rsconnect"')
    })
    .catch((err: any) => {
      core.error(errInstallPython)
      core.setFailed(err)
    })
}

export function loadArgs (): ActionArgs {
  const version = core.getInput('rsconnect-python-version')
  const args = new ActionArgs()
  args.version = version === '' ? 'latest' : version
  return args
}
