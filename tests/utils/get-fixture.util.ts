import path from "path";

export const enum FixtureSizes {
  EMPTY = 0,
  SMALL = 1 * 1024 * 1024,
  MEDIUM = 2 * 1024 * 1024,
  LARGE = 3 * 1024 * 1024,
  IMAGE = 4 * 1024 * 1024
}

export const getFixture = (fixture: keyof typeof FixtureSizes, extension = "dat"): string => {
  return path.join(__dirname, "../fixtures", `${fixture.toLowerCase()}.${extension}`);
};
