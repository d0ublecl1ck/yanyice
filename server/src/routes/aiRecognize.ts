import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { getUserAiApiKey, getUserAiConfig } from "../ai/userAiConfig";
import { zhipuChatJson } from "../ai/zhipu";
import { deriveLinesFromHexagramNames, parseHexagramPairFromText } from "../liuyao/recognitionHexagram";
import { parseLiuyaoIsoFromText } from "../liuyao/recognitionTime";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const RecognizeBody = Type.Object({
  target: Type.Union([Type.Literal("bazi"), Type.Literal("liuyao"), Type.Literal("customer")]),
  text: Type.Optional(Type.String({ maxLength: 8000 })),
  image: Type.Optional(
    Type.Object({
      data: Type.String({ maxLength: 4_000_000 }),
      mimeType: Type.String({ maxLength: 80 }),
    }),
  ),
});

type RecognizeBodyType = Static<typeof RecognizeBody>;

const instructionByTarget: Record<RecognizeBodyType["target"], string> = {
  bazi: `
你是一个专业的八字信息整理助手。
你的任务是从用户提供的文字描述与/或图片中，提取结构化信息，用于自动填写表单。

请尽量识别：
1) 姓名（name）
2) 性别（gender）：male / female / other
3) 出生地（location）：尽量保持中文地名
4) 公历出生时间（solar）：y,m,d,h,min（若缺失可省略）
5) 四柱（fourPillars）：yearStem/yearBranch/monthStem/monthBranch/dayStem/dayBranch/hourStem/hourBranch（若缺失可省略）

只输出 JSON，不要输出额外文字。
`.trim(),
  liuyao: `
你是一个专业的六爻排盘助手。你的任务是从用户的文本描述与/或卦例图片中提取出结构化的六爻数据。

六爻数据包括：
1) 问事主题（subject，必填）
2) 起卦时间（必填，精确到分钟）：优先输出 iso（如 2025-01-01T10:30:00+08:00），或输出 solar：y,m,d,h,min（二选一，至少一个）
2.1) 若文本出现“本卦/变卦”或类似“地水师变天地否”，请尽量输出 baseHexagramName 与 changedHexagramName（可选，但建议）。
3) 6个爻的状态（lines，可选）：0=少阳, 1=少阴, 2=老阳（动）, 3=老阴（动）。顺序必须是从下往上（初爻到上爻）。
4) 若仅识别到四柱，可输出 fourPillars（8字或带空格），但仍应尽量给出起卦时间到分钟。

只输出 JSON，不要输出额外文字。
`.trim(),
  customer: `
你是一个专业的客户信息录入助手。
你的任务是从用户的文字描述与/或图片中提取结构化信息，用于创建客户档案。

请尽量识别：
1) 姓名（name）
2) 性别（gender）：male / female / other
3) 联系方式（phone，可选）
4) 标签（tags，可选，字符串数组）
5) 备注（notes，可选）

只输出 JSON，不要输出额外文字。
`.trim(),
};

export async function aiRecognizeRoutes(app: FastifyInstance) {
  app.post(
    "/ai/recognize",
    {
      schema: {
        tags: ["ai"],
        security: [{ bearerAuth: [] }],
        body: RecognizeBody,
        response: { 200: Type.Any(), 400: ErrorResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as RecognizeBodyType;
      const trimmedText = (body.text ?? "").trim();
      const hasImage = Boolean(body.image?.data && body.image?.mimeType);

      if (!trimmedText && !hasImage) {
        return reply.status(400).send({ code: "EMPTY_INPUT", message: "请至少提供文字或图片" });
      }

      const cfg = await getUserAiConfig(app.prisma, userId);
      if (!cfg.model.trim()) {
        return reply.status(400).send({ code: "AI_MODEL_REQUIRED", message: "请先在设置中配置模型" });
      }

      const apiKey = await getUserAiApiKey(app.prisma, userId, cfg.vendor);
      if (!apiKey) {
        return reply.status(400).send({ code: "AI_API_KEY_REQUIRED", message: "请先在设置中配置 API Key" });
      }

      const parts: Array<
        { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
      > = [];
      if (hasImage && body.image) {
        const dataUrl = `data:${body.image.mimeType};base64,${body.image.data}`;
        parts.push({ type: "image_url", image_url: { url: dataUrl } });
      }
      if (trimmedText) {
        parts.push({ type: "text", text: trimmedText });
      }

      const result = await zhipuChatJson({
        vendor: cfg.vendor,
        apiKey,
        model: cfg.model.trim(),
        messages: [
          { role: "system", content: instructionByTarget[body.target] },
          { role: "user", content: parts },
        ],
      });

      if (body.target === "liuyao" && trimmedText && result && typeof result === "object" && !Array.isArray(result)) {
        const obj = result as Record<string, unknown>;
        const hasIso = typeof obj.iso === "string" && obj.iso.trim().length > 0;
        const hasSolar = obj.solar && typeof obj.solar === "object";

        if (!hasIso && !hasSolar) {
          const fallbackIso = parseLiuyaoIsoFromText(trimmedText);
          if (fallbackIso) obj.iso = fallbackIso;
        }

        const lines = obj.lines;
        const hasLines =
          Array.isArray(lines) && lines.length === 6 && lines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);

        if (!hasLines) {
          const baseHexagramName = typeof obj.baseHexagramName === "string" ? obj.baseHexagramName.trim() : "";
          const changedHexagramName =
            typeof obj.changedHexagramName === "string" ? obj.changedHexagramName.trim() : "";

          const parsed =
            (baseHexagramName ? { baseHexagramName, changedHexagramName: changedHexagramName || undefined } : null) ??
            parseHexagramPairFromText(trimmedText);

          if (parsed) {
            const derived = deriveLinesFromHexagramNames(parsed.baseHexagramName, parsed.changedHexagramName);
            if (derived && derived.length === 6) {
              obj.lines = derived;
              obj.baseHexagramName = parsed.baseHexagramName;
              if (parsed.changedHexagramName) obj.changedHexagramName = parsed.changedHexagramName;
            }
          }
        }
      }

      return result;
    },
  );
}
