import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { getUserAiConfig, upsertUserAiConfig } from "../ai/userAiConfig";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const AiConfigResponse = Type.Object({
  vendor: Type.Literal("zhipu"),
  model: Type.String(),
  hasApiKey: Type.Boolean(),
});

const UpdateAiConfigBody = Type.Object({
  vendor: Type.Optional(Type.Literal("zhipu")),
  model: Type.Optional(Type.String({ maxLength: 80 })),
  apiKey: Type.Optional(Type.String({ maxLength: 200 })),
});

type UpdateAiConfigBodyType = Static<typeof UpdateAiConfigBody>;

export async function aiConfigRoutes(app: FastifyInstance) {
  app.get(
    "/ai/config",
    {
      schema: {
        tags: ["ai"],
        security: [{ bearerAuth: [] }],
        response: { 200: AiConfigResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;
      const cfg = await getUserAiConfig(app.prisma, userId);
      return { vendor: "zhipu", model: cfg.model, hasApiKey: cfg.hasApiKey };
    },
  );

  app.put(
    "/ai/config",
    {
      schema: {
        tags: ["ai"],
        security: [{ bearerAuth: [] }],
        body: UpdateAiConfigBody,
        response: { 200: AiConfigResponse, 400: ErrorResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as UpdateAiConfigBodyType;

      const current = await getUserAiConfig(app.prisma, userId);
      const nextModel = typeof body.model === "string" ? body.model.trim() : current.model;
      const nextApiKey = typeof body.apiKey === "string" ? body.apiKey : undefined;

      if (nextModel.length > 80) {
        return reply.status(400).send({ code: "INVALID_MODEL", message: "模型过长" });
      }

      const cfg = await upsertUserAiConfig(app.prisma, userId, {
        vendor: "zhipu",
        model: nextModel,
        apiKey: nextApiKey,
      });

      return { vendor: "zhipu", model: cfg.model, hasApiKey: cfg.hasApiKey };
    },
  );
}

