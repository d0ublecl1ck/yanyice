import type { PrismaClient } from "@prisma/client";

import { createPrismaBundle } from "./prisma";

type PrismaGlobal = typeof globalThis & {
  __yanyicePrisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  const globalRef = globalThis as PrismaGlobal;
  if (!globalRef.__yanyicePrisma) {
    globalRef.__yanyicePrisma = createPrismaBundle().prisma;
  }
  return globalRef.__yanyicePrisma;
}

