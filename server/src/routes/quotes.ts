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

type CreateQuoteBodyType = Static<typeof CreateQuoteBody>;
type UpdateQuoteBodyType = Static<typeof UpdateQuoteBody>;

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

