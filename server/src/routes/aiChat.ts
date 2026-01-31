import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { getUserAiApiKey, getUserAiConfig } from "../ai/userAiConfig";
import { aiChat } from "../ai/chat";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const ChatBody = Type.Object({
  systemInstruction: Type.String({ maxLength: 8000 }),
  messages: Type.Array(
    Type.Object({
      role: Type.Union([Type.Literal("user"), Type.Literal("model")]),
      text: Type.String({ maxLength: 8000 }),
    }),
    { maxItems: 60 },
  ),
});

type ChatBodyType = Static<typeof ChatBody>;

const ChatResponse = Type.Object({
  text: Type.String(),
});

export async function aiChatRoutes(app: FastifyInstance) {
  app.post(
    "/ai/chat",
    {
      schema: {
        tags: ["ai"],
        security: [{ bearerAuth: [] }],
        body: ChatBody,
        response: { 200: ChatResponse, 400: ErrorResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as ChatBodyType;

      const cfg = await getUserAiConfig(app.prisma, userId);
      if (!cfg.model.trim()) {
        return reply.status(400).send({ code: "AI_MODEL_REQUIRED", message: "请先在设置中配置模型" });
      }

      const apiKey = await getUserAiApiKey(app.prisma, userId, cfg.vendor);
      if (!apiKey) {
        return reply.status(400).send({ code: "AI_API_KEY_REQUIRED", message: "请先在设置中配置 API Key" });
      }

      const text = await aiChat({
        vendor: cfg.vendor,
        apiKey,
        model: cfg.model.trim(),
        messages: [
          { role: "system", content: body.systemInstruction },
          ...body.messages.map((m) => ({
            role: m.role === "model" ? ("assistant" as const) : ("user" as const),
            content: m.text,
          })),
        ],
      });

      return { text };
    },
  );
}
