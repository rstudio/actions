import * as core from '@actions/core'
import { connectPublish, loadArgs } from './connect-publish'

export function run (): void {
  connectPublish(loadArgs()).catch((err: any) => core.setFailed(err))
}

run()
