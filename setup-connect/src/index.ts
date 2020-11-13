import * as core from "@actions/core";

export async function run() {
  try {
    core.debug("started action");
  } catch (err: any) {
    core.setFailed(err);
  }
};

if (require.main === module) {
  run();
}
