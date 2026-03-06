import type { FastifyInstance } from "fastify";

import { buildApp } from "./app";

type AppGlobal = typeof globalThis & {
  __yanyiceAppPromise?: Promise<FastifyInstance>;
};

export function getApp(): Promise<FastifyInstance> {
  const globalRef = globalThis as AppGlobal;
  if (!globalRef.__yanyiceAppPromise) {
    globalRef.__yanyiceAppPromise = (async () => {
      const app = buildApp({ logger: false, includeDocs: false });
      await app.ready();
      return app;
    })();
  }
  return globalRef.__yanyiceAppPromise;
}
