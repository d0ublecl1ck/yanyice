import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

import { getDatabaseUrl } from "./config";
import { ensureSqliteDirectory } from "./db/ensureSqliteDirectory";

export type PrismaBundle = {
  prisma: PrismaClient;
  close: () => Promise<void>;
};

export function createPrismaBundle(databaseUrl?: string): PrismaBundle {
  const url = databaseUrl ?? process.env.DATABASE_URL ?? getDatabaseUrl();
  ensureSqliteDirectory(url);
  const adapter = new PrismaLibSql({ url });
  const prisma = new PrismaClient({ adapter });

  return {
    prisma,
    close: async () => {
      await prisma.$disconnect();
    },
  };
}
