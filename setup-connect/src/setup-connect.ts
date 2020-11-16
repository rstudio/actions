import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as style from 'ansi-styles'

class ActionArgs {
  public version: string = ''
}

const errInstallPython = [
  'Please ensure python is available, such as by running a',
  'step with "uses: actions/setup-python@v2" prior to this step.'
].join(' ')

export async function setupConnect (args: ActionArgs): Promise<any> {
  let spec = 'rsconnect-python'
  if (args.version !== 'latest') {
    spec = `${spec}==${args.version}`
  }

  return await exec.exec('python', ['--version'])
    .then(async () => await exec.exec('python', ['-m', 'ensurepip', '--default-pip']))
    .then(async () => await exec.exec('python', ['-m', 'pip', 'install', spec]))
    .then(() => {
      core.info([
        style.greenBright.open,
        'Installed rsconnect-python, which is available as "rsconnect"',
        style.greenBright.close
      ].join(''))
    })
    .catch((err: any) => {
      core.error([
        style.yellowBright.open,
        errInstallPython,
        style.yellowBright.close
      ].join(''))
      core.setFailed(err)
    })
}

export function loadArgs (): ActionArgs {
  const version = core.getInput('rsconnect-python-version')
  const args = new ActionArgs()
  args.version = version === '' ? 'latest' : version
  return args
}
