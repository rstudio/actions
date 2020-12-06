import path from 'path'
import process from 'process'

import {
  ConnectPublishResult,
  connectPublish,
  loadArgs
} from "../src/connect-publish";

const HERE = path.resolve(__dirname, '.')
const CWD = process.cwd()

jest.setTimeout(1000 * 60 * 2)

describe("connectPublish", () => {
  beforeEach(() => {
    process.env['INPUT_URL'] = `http://${process.env.RSTUDIO_CONNECT_API_KEY}@127.0.0.1:23939`
    process.chdir(HERE)
  })

  afterEach(() => {
    process.chdir(CWD)
  })

  const testCases = [
    {
      dir: 'testapps/plumber:/fancy/plumber/app',
      expectError: false
    },
    {
      dir: 'testapps/flask:/equally/fancy/flask/app',
      expectError: false
    },
    {
      dir: 'testapps/bogus:/at/least/i/tried:/too/much/really',
      expectError: true
    }
  ]

  testCases.forEach((tc: any) => {
    it(`publishes ${tc.dir} to connect`, async () => {
      process.env["INPUT_DIR"] = tc.dir
      const results = await connectPublish(loadArgs())
        .catch((err: any) => {
          if (tc.expectError) {
            expect(err).not.toBeNull()
            return
          }
          expect(err).toBeNull()
        })
      if (!tc.expectError) {
        expect(
          (results as ConnectPublishResult[]).some(
            (res: ConnectPublishResult) => !res.success
          )
        ).toBe(false)
      }
    });
  });
});

describe("loadArgs", () => {
  it("accepts valid URL and api-key", () => {
    process.env["INPUT_API-KEY"] = "bogus";
    process.env["INPUT_URL"] = "https://connect.example.org";

    const args = loadArgs();

    expect(args.url).toBe("https://connect.example.org/");
    expect(args.apiKey).toBe("bogus");
  });

  it("accepts api-key as username in URL", () => {
    process.env["INPUT_API-KEY"] = "bogus";
    process.env["INPUT_URL"] = "https://gnarly@connect.example.org";

    const args = loadArgs();

    expect(args.url).toBe("https://connect.example.org/");
    expect(args.apiKey).toBe("gnarly");
  });

  it("accepts api-key as password in URL", () => {
    process.env["INPUT_API-KEY"] = "bogus";
    process.env["INPUT_URL"] = "https://discarded:radical@connect.example.org";

    const args = loadArgs();

    expect(args.url).toBe("https://connect.example.org/");
    expect(args.apiKey).toBe("radical");
  });
});
