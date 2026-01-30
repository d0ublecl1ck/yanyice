import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { ensureDefaultQuotes, resetDefaultQuotes } from "../quotes/ensureDefaultQuotes";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const QuoteDto = Type.Object({
  id: Type.String(),
  text: Type.String(),
  enabled: Type.Boolean(),
  isSystem: Type.Boolean(),
});

const CreateQuoteBody = Type.Object({
  text: Type.String({ minLength: 1, maxLength: 300 }),
  enabled: Type.Optional(Type.Boolean()),
});

const UpdateQuoteBody = Type.Partial(CreateQuoteBody);

const UpdateQuoteLinesBody = Type.Object({
  lines: Type.String({ maxLength: 50_000 }),
});

type CreateQuoteBodyType = Static<typeof CreateQuoteBody>;
type UpdateQuoteBodyType = Static<typeof UpdateQuoteBody>;
type UpdateQuoteLinesBodyType = Static<typeof UpdateQuoteLinesBody>;

function toQuoteDto(row: { id: string; text: string; enabled: boolean; seedKey: string | null }): Static<typeof QuoteDto> {
  return {
    id: row.id,
    text: row.text,
    enabled: row.enabled,
    isSystem: Boolean(row.seedKey),
  };
}

export async function quoteRoutes(app: FastifyInstance) {
  app.get(
    "/quotes",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        response: { 200: Type.Object({ quotes: Type.Array(QuoteDto) }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;

      await ensureDefaultQuotes(app.prisma, userId);

      const rows = await app.prisma.quote.findMany({
        where: { userId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, text: true, enabled: true, seedKey: true },
      });

      return { quotes: rows.map(toQuoteDto) };
    },
  );

  app.post(
    "/quotes",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        body: CreateQuoteBody,
        response: { 201: Type.Object({ quote: QuoteDto }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as CreateQuoteBodyType;

      const created = await app.prisma.quote.create({
        data: { userId, text: body.text.trim(), enabled: body.enabled ?? true },
        select: { id: true, text: true, enabled: true, seedKey: true },
      });

      return reply.status(201).send({ quote: toQuoteDto(created) });
    },
  );

  app.put(
    "/quotes/bulk",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        body: UpdateQuoteLinesBody,
        response: { 204: Type.Null(), 400: ErrorResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as UpdateQuoteLinesBodyType;

      const lines = body.lines
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean);

      const deduped: string[] = [];
      const seen = new Set<string>();
      for (const line of lines) {
        if (seen.has(line)) continue;
        seen.add(line);
        deduped.push(line);
      }

      if (deduped.length === 0) {
        return reply.status(400).send({ code: "EMPTY_QUOTES", message: "请至少保留一条名言" });
      }

      if (deduped.some((text) => text.length > 300)) {
        return reply.status(400).send({ code: "QUOTE_TOO_LONG", message: "单条名言最多 300 字" });
      }

      await ensureDefaultQuotes(app.prisma, userId);

      const existing = await app.prisma.quote.findMany({
        where: { userId },
        select: { id: true, text: true },
      });

      const existingByText = new Map(existing.map((q) => [q.text, q.id] as const));

      const enableIds: string[] = [];
      const createTexts: string[] = [];
      for (const text of deduped) {
        const existingId = existingByText.get(text);
        if (existingId) enableIds.push(existingId);
        else createTexts.push(text);
      }

      await app.prisma.$transaction(async (tx) => {
        await tx.quote.updateMany({
          where: { userId, id: { in: enableIds } },
          data: { enabled: true },
        });

        await tx.quote.updateMany({
          where: { userId, id: { notIn: enableIds } },
          data: { enabled: false },
        });

        if (createTexts.length > 0) {
          await tx.quote.createMany({
            data: createTexts.map((text) => ({ userId, text, enabled: true })),
          });
        }
      });

      return reply.status(204).send();
    },
  );

  app.put(
    "/quotes/:id",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        body: UpdateQuoteBody,
        response: { 200: Type.Object({ quote: QuoteDto }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateQuoteBodyType;

      const existing = await app.prisma.quote.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该名言" });
      }

      const updated = await app.prisma.quote.update({
        where: { id },
        data: {
          text: body.text === undefined ? undefined : body.text.trim(),
          enabled: body.enabled,
        },
        select: { id: true, text: true, enabled: true, seedKey: true },
      });

      return { quote: toQuoteDto(updated) };
    },
  );

  app.delete(
    "/quotes/:id",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: { 204: Type.Null(), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const existing = await app.prisma.quote.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该名言" });
      }

      await app.prisma.quote.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  app.post(
    "/quotes/reset",
    {
      schema: {
        tags: ["quotes"],
        security: [{ bearerAuth: [] }],
        response: { 204: Type.Null(), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      await resetDefaultQuotes(app.prisma, userId);
      return reply.status(204).send();
    },
  );
}
