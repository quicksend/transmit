import fs from "fs";
import os from "os";
import path from "path";

import { IncomingFile, TransmitManager } from "../transmit.interfaces";

export const DISK_MANAGER_DEFAULT_OPTIONS: DiskManagerOptions = {
  directory: os.tmpdir()
};

export interface DiskManagerOptions {
  directory: string;
}

export class DiskManager implements TransmitManager {
  protected readonly options: DiskManagerOptions;

  constructor(options: Partial<DiskManagerOptions> = {}) {
    this.options = {
      ...DISK_MANAGER_DEFAULT_OPTIONS,
      ...options
    };
  }

  async createWritableStream(file: IncomingFile): Promise<NodeJS.WritableStream> {
    await fs.promises.mkdir(this.options.directory, {
      recursive: true
    });

    const destination = path.join(this.options.directory, file.id);

    return fs.createWriteStream(destination);
  }

  async deleteFile(file: IncomingFile): Promise<void> {
    const destination = path.join(this.options.directory, file.id);

    try {
      await fs.promises.unlink(destination);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}
