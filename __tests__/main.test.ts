import { sum } from "../src/main";

describe("sum", () => {
  test("works", () => {
    expect(sum(1, 2)).toEqual(3);
  });
});
