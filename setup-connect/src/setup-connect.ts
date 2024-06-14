import * as core from '@actions/core'
import * as exec from '@actions/exec'
import styles from 'ansi-styles'

class ActionArgs {
  public pyRuntime: boolean = false
  public pyVersion: string = ''
  public rRuntime: boolean = false
  public rVersion: string = ''
}

const errInstallPython = [
  'Please ensure python is available, such as by running a',
  'step with "uses: actions/setup-python@v2" prior to this step.'
].join(' ')

const errInstallR = [
  'Please ensure R is available, such as by running a step',
  'with "uses: r-lib/actions/setup-r@v1" prior to this step.'
].join(' ')

export async function setupConnect (args: ActionArgs): Promise<any> {
  if (!args.rRuntime && !args.pyRuntime) {
    throw new Error('no runtimes specified')
  }

  if (args.rRuntime) {
    await ensureRsconnect(args.rVersion)
  }

  if (args.pyRuntime) {
    await ensureRSConnectPython(args.pyVersion)
  }
}

async function ensureRsconnect (rVersion: string): Promise<any> {
  let version = 'NULL'
  if (rVersion !== 'latest') {
    version = `'${rVersion}'`
  }

  return await exec.exec('Rscript', ['--version'])
    .then(
      async () => await exec.exec(
        'Rscript',
        rscriptCommand('install.packages(\'remotes\')')
      )
    )
    .then(
      async () => await exec.exec(
        'Rscript',
        rscriptCommand(
          // eslint-disable-next-line no-useless-escape
          `remotes::install_version(\'rsconnect\', version = ${version})`
        )
      )
    )
    .then(() => {
      core.info([
        styles.greenBright.open,
        styles.bold.open,
        'Installed rsconnect',
        styles.reset.close
      ].join(''))
    })
    .catch((err: any) => {
      core.error([
        styles.yellowBright.open,
        styles.bold.open,
        errInstallR,
        styles.reset.close
      ].join(''))
      core.setFailed(err)
    })
}

function rscriptCommand (body: string): string[] {
  return [
    '--vanilla',
    '-e',
    [
      'options(repos = list(CRAN = \'https://packagemanager.posit.co/cran/latest\', \'@CRAN@\' = \'https://cloud.r-project.org\'))',
      body
    ].join(';')
  ]
}

async function ensureRSConnectPython (pyVersion: string): Promise<any> {
  let spec = 'rsconnect-python'
  if (pyVersion !== 'latest') {
    spec = `${spec}==${pyVersion}`
  }

  return await exec.exec('python', ['--version'])
    .then(async () => await exec.exec('python', ['-m', 'ensurepip', '--default-pip']))
    .then(async () => await exec.exec('python', ['-m', 'pip', 'install', spec]))
    .then(() => {
      core.info([
        styles.greenBright.open,
        styles.bold.open,
        'Installed rsconnect-python, which is available as "rsconnect"',
        styles.reset.close
      ].join(''))
    })
    .catch((err: any) => {
      core.error([
        styles.yellowBright.open,
        styles.bold.open,
        errInstallPython,
        styles.reset.close
      ].join(''))
      core.setFailed(err)
    })
}

export function loadArgs (): ActionArgs {
  const rVersion = core.getInput('rsconnect-version')
  const pyVersion = core.getInput('rsconnect-python-version')
  const args = new ActionArgs()

  args.pyRuntime = core.getInput('python') === 'true'
  args.pyVersion = pyVersion === '' ? 'latest' : pyVersion
  args.rRuntime = core.getInput('r') === 'true'
  args.rVersion = rVersion === '' ? 'latest' : rVersion
  return args
}
