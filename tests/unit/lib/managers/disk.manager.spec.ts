import fs from "fs";

import { DiskManager } from "../../../../src";

import { createMockIncomingFile } from "../../../utils/create-mock-incoming-file.util";
import { createTmpDirectory } from "../../../utils/create-tmp-dir.util";

const TEMP_DIRECTORY = createTmpDirectory();

describe("DiskManager", () => {
  let manager: DiskManager;

  afterAll(() => fs.rmSync(TEMP_DIRECTORY, { force: true, recursive: true }));

  beforeEach(() => {
    manager = new DiskManager({
      directory: TEMP_DIRECTORY
    });
  });

  it("should be defined", () => {
    expect(DiskManager).toBeDefined();
  });

  describe("#createWritableStream", () => {
    it("should return a write stream", async () => {
      const writeStream = await manager.createWritableStream(createMockIncomingFile());

      expect(writeStream).toBeInstanceOf(fs.WriteStream);

      // Ensure that the destination of the file should start with the same directory we passed in as options
      expect((writeStream as fs.WriteStream).path).toMatch(
        new RegExp(`^${TEMP_DIRECTORY.replace(/\\/g, "\\\\")}?`)
      );
    });
  });

  describe("#deleteFile", () => {
    it("should delete the file", async () => {
      await manager.deleteFile(createMockIncomingFile());
    });
  });
});
