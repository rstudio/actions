import { loadArgs } from "../src/connect-publish";

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

describe("connectPublish", () => {
  it.skip("publishes to connect", () => {
  });
});
