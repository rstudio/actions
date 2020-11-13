import * as core from "@actions/core";

interface ActionArgs {
  apiKey: string;
  url: string;
}

export async function setupConnect(args: ActionArgs): Promise<void> {
  core.debug("not doing anything");
};
