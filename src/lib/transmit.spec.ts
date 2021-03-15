import { Transmit } from "./transmit";

describe("Transmit", () => {
  let transmit: Transmit;

  beforeEach(() => {
    transmit = new Transmit();
  });

  it("should be defined", () => {
    expect(transmit).toBeDefined();
  });
})