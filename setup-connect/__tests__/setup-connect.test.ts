import { setupConnect } from "../src/setup-connect";

describe("setupConnect", () => {
  it("does nothing", async () => {
    await setupConnect({ apiKey: "bogus", url: "https://connect.example.org" });
  });
});
