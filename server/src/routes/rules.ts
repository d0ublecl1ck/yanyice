import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import type { ModuleType } from "@prisma/client";

import { BUILTIN_RULE_SEEDS } from "../rules/builtinRuleSeeds";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const RuleDto = Type.Object({
  id: Type.String(),
  module: Type.Union([Type.Literal("liuyao"), Type.Literal("bazi")]),
  name: Type.String(),
  enabled: Type.Boolean(),
  condition: Type.String(),
  message: Type.String(),
});

const ModuleQuery = Type.Object({
  module: Type.Optional(Type.Union([Type.Literal("liuyao"), Type.Literal("bazi")])),
});

const CreateRuleBody = Type.Object({
  module: Type.Union([Type.Literal("liuyao"), Type.Literal("bazi")]),
  name: Type.String({ minLength: 1, maxLength: 200 }),
  enabled: Type.Optional(Type.Boolean()),
  condition: Type.Optional(Type.String({ minLength: 1, maxLength: 1000 })),
  message: Type.String({ minLength: 1, maxLength: 20_000 }),
});

const UpdateRuleBody = Type.Partial(CreateRuleBody);

type CreateRuleBodyType = Static<typeof CreateRuleBody>;
type UpdateRuleBodyType = Static<typeof UpdateRuleBody>;

function normalizeModule(module: Static<typeof RuleDto>["module"]): ModuleType {
  return module === "bazi" ? "bazi" : "liuyao";
}

function toRuleDto(row: {
  id: string;
  module: ModuleType;
  name: string;
  enabled: boolean;
  condition: string;
  message: string;
}): Static<typeof RuleDto> {
  return {
    id: row.id,
    module: row.module === "bazi" ? "bazi" : "liuyao",
    name: row.name,
    enabled: row.enabled,
    condition: row.condition,
    message: row.message,
  };
}

async function ensureSeedRules(app: FastifyInstance, userId: string) {
  for (const seed of BUILTIN_RULE_SEEDS) {
    await app.prisma.rule.upsert({
      where: { userId_seedKey: { userId, seedKey: seed.seedKey } },
      update: {},
      create: { userId, ...seed },
    });
  }
}

export async function ruleRoutes(app: FastifyInstance) {
  app.get(
    "/rules",
    {
      schema: {
        tags: ["rules"],
        security: [{ bearerAuth: [] }],
        querystring: ModuleQuery,
        response: { 200: Type.Object({ rules: Type.Array(RuleDto) }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;
      await ensureSeedRules(app, userId);

      const { module } = request.query as { module?: Static<typeof RuleDto>["module"] };
      const where = module ? { userId, module: normalizeModule(module) } : { userId };

      const rows = await app.prisma.rule.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: { id: true, module: true, name: true, enabled: true, condition: true, message: true },
      });

      return { rules: rows.map(toRuleDto) };
    },
  );

  app.post(
    "/rules",
    {
      schema: {
        tags: ["rules"],
        security: [{ bearerAuth: [] }],
        body: CreateRuleBody,
        response: { 201: Type.Object({ rule: RuleDto }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as CreateRuleBodyType;

      const created = await app.prisma.rule.create({
        data: {
          userId,
          module: normalizeModule(body.module),
          name: body.name.trim(),
          enabled: body.enabled ?? true,
          condition: (body.condition ?? "自定义条件").trim(),
          message: body.message.trim(),
        },
        select: { id: true, module: true, name: true, enabled: true, condition: true, message: true },
      });

      return reply.status(201).send({ rule: toRuleDto(created) });
    },
  );

  app.put(
    "/rules/:id",
    {
      schema: {
        tags: ["rules"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        body: UpdateRuleBody,
        response: { 200: Type.Object({ rule: RuleDto }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateRuleBodyType;

      const existing = await app.prisma.rule.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该规则" });
      }

      const updated = await app.prisma.rule.update({
        where: { id },
        data: {
          module: body.module === undefined ? undefined : normalizeModule(body.module),
          name: body.name === undefined ? undefined : body.name.trim(),
          enabled: body.enabled,
          condition: body.condition === undefined ? undefined : body.condition.trim(),
          message: body.message === undefined ? undefined : body.message.trim(),
        },
        select: { id: true, module: true, name: true, enabled: true, condition: true, message: true },
      });

      return { rule: toRuleDto(updated) };
    },
  );

  app.delete(
    "/rules/:id",
    {
      schema: {
        tags: ["rules"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: { 204: Type.Null(), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const existing = await app.prisma.rule.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该规则" });
      }

      await app.prisma.rule.delete({ where: { id } });
      return reply.status(204).send();
    },
  );
}
