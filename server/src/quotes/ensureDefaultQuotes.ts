import type { PrismaClient } from "@prisma/client";

import { DEFAULT_QUOTES } from "./defaultQuotes";

export async function ensureDefaultQuotes(prisma: PrismaClient, userId: string): Promise<void> {
  await Promise.all(
    DEFAULT_QUOTES.map((quote) =>
      prisma.quote.upsert({
        where: { userId_seedKey: { userId, seedKey: quote.seedKey } },
        create: { userId, seedKey: quote.seedKey, text: quote.text, enabled: true },
        update: {},
        select: { id: true },
      }),
    ),
  );
}

export async function resetDefaultQuotes(prisma: PrismaClient, userId: string): Promise<void> {
  await Promise.all(
    DEFAULT_QUOTES.map((quote) =>
      prisma.quote.upsert({
        where: { userId_seedKey: { userId, seedKey: quote.seedKey } },
        create: { userId, seedKey: quote.seedKey, text: quote.text, enabled: true },
        update: { text: quote.text, enabled: true },
        select: { id: true },
      }),
    ),
  );
}

