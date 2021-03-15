import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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

  async createWritableStream(
    file: IncomingFile
  ): Promise<NodeJS.WritableStream> {
    await fs.promises.mkdir(this.options.directory, {
      recursive: true
    });

    const pathToFile = path.join(this.options.directory, file.discriminator);

    return fs.createWriteStream(pathToFile);
  }

  async deleteFile(file: IncomingFile): Promise<void> {
    const pathToFile = path.join(this.options.directory, file.discriminator);

    try {
      await fs.promises.unlink(pathToFile);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}
