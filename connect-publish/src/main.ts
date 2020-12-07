import * as core from '@actions/core'
import { connectPublish, ConnectPublishResult, loadArgs } from './connect-publish'

export function run (): void {
  connectPublish(loadArgs())
    .then((results: ConnectPublishResult[]) => {
      core.setOutput('results', JSON.stringify(results))
    })
    .catch((err: any) => {
      core.setFailed(err)
      core.setOutput('results', JSON.stringify([]))
    })
}

run()
