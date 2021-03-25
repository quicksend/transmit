import { RequestListener, Server, createServer } from "http";

export const createTestServer = (listener: RequestListener): Promise<Server> => {
  return new Promise((resolve) => {
    const server = createServer(listener);

    server.listen(() => resolve(server));
  });
};
