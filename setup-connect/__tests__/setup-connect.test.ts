import { setupConnect, loadArgs } from "../src/setup-connect";

describe("loadArgs", () => {
  it("accepts rsconnect-python-version", () => {
    process.env["INPUT_RSCONNECT-PYTHON-VERSION"] = "fancy";

    const args = loadArgs();

    expect(args.rsconnectPythonVersion).toBe("fancy");
  });

  it("defaults rsconnect-python-version to 'latest'", () => {
    delete process.env["INPUT_RSCONNECT-PYTHON-VERSION"]
    const args = loadArgs();

    expect(args.rsconnectPythonVersion).toBe("latest");
  });
});

describe("setupConnect", () => {
  it.skip('ensures rsconnect-python is available', () => {
  });
});
