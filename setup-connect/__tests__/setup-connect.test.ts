import { setupConnect, loadArgs } from "../src/setup-connect";

describe("loadArgs", () => {
  it("accepts rsconnect-python-version", () => {
    process.env["INPUT_RSCONNECT-PYTHON-VERSION"] = "fancy";
    process.env["INPUT_PYTHON"] = "true"

    const args = loadArgs();

    expect(args.pyVersion).toBe("fancy");
  });

  it("defaults rsconnect-python-version to 'latest'", () => {
    process.env["INPUT_PYTHON"] = "true"
    delete process.env["INPUT_RSCONNECT-PYTHON-VERSION"]

    const args = loadArgs();

    expect(args.pyVersion).toBe("latest");
  });
});

describe("setupConnect", () => {
  it.skip('ensures rsconnect-python Python package is available', () => {
  });

  it.skip('ensures rsconnect R package is available', () => {
  });
});
