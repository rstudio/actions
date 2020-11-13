import * as core from "@actions/core";
import { setupConnect } from "./setup-connect";

export async function run(): Promise<void> {
  try {
    const apiKey = core.getInput("api-key");
    const url = core.getInput("url");
    setupConnect({ apiKey, url });
  } catch (err: any) {
    core.setFailed(err);
  }
};

run();
