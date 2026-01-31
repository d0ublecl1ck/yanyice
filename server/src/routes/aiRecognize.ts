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

const liuyaoFallbackFromImageInstruction = `
你是一个专门从六爻截图中“抠字段”的识别器。
你的任务：只从图片中提取以下字段，并输出 JSON（不要输出额外文字）。

字段：
1) 起卦时间（必填，精确到分钟）：优先输出 iso（如 2025-01-01T10:30:00+08:00），或输出 solar：y,m,d,h,min（二选一，至少一个）
2) 本卦与变卦（可选，但尽量）：baseHexagramName / changedHexagramName（例如：地水师 / 天地否）
3) 若能判断动爻，也可直接输出 lines（可选）：0=少阳,1=少阴,2=老阳（动）,3=老阴（动），顺序从下往上（初爻到上爻）

提示：截图里常见字段名有“日期/起卦时间/本卦/变卦/动爻”。
`.trim();

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

      if (body.target === "liuyao" && result && typeof result === "object" && !Array.isArray(result)) {
        const obj = result as Record<string, unknown>;
        const hasIso = typeof obj.iso === "string" && obj.iso.trim().length > 0;
        const hasSolar = obj.solar && typeof obj.solar === "object";

        if (trimmedText && !hasIso && !hasSolar) {
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
            (trimmedText ? parseHexagramPairFromText(trimmedText) : null);

          if (parsed) {
            const derived = deriveLinesFromHexagramNames(parsed.baseHexagramName, parsed.changedHexagramName);
            if (derived && derived.length === 6) {
              obj.lines = derived;
              obj.baseHexagramName = parsed.baseHexagramName;
              if (parsed.changedHexagramName) obj.changedHexagramName = parsed.changedHexagramName;
            }
          }
        }

        // If the vision model omitted time/hexagrams, run a narrow second pass that focuses on these fields only.
        // This is a best-effort fallback and only triggers when we have an image.
        if (hasImage) {
          const afterTextFallbackHasIso = typeof obj.iso === "string" && obj.iso.trim().length > 0;
          const afterTextFallbackHasSolar = obj.solar && typeof obj.solar === "object";
          const afterDeriveHasLines =
            Array.isArray(obj.lines) &&
            obj.lines.length === 6 &&
            obj.lines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);

          const needsTime = !afterTextFallbackHasIso && !afterTextFallbackHasSolar;
          const needsHexagramInfo =
            !afterDeriveHasLines &&
            !(
              typeof obj.baseHexagramName === "string" &&
              obj.baseHexagramName.trim() &&
              typeof obj.changedHexagramName === "string" &&
              obj.changedHexagramName.trim()
            );

          if (needsTime || needsHexagramInfo) {
            request.log.info(
              {
                target: "liuyao",
                needsTime,
                needsHexagramInfo,
              },
              "aiRecognize: running liuyao image fallback pass",
            );

            try {
              const fallback = await zhipuChatJson({
                vendor: cfg.vendor,
                apiKey,
                model: cfg.model.trim(),
                messages: [
                  { role: "system", content: liuyaoFallbackFromImageInstruction },
                  { role: "user", content: hasImage ? parts.filter((p) => p.type === "image_url") : parts },
                ],
              });

              if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
                const f = fallback as Record<string, unknown>;

                if (needsTime) {
                  if (typeof f.iso === "string" && f.iso.trim()) obj.iso = f.iso.trim();
                  if (!obj.solar && f.solar && typeof f.solar === "object") obj.solar = f.solar;
                }

                if (!afterDeriveHasLines) {
                  const fLines = f.lines;
                  const fHasLines =
                    Array.isArray(fLines) &&
                    fLines.length === 6 &&
                    fLines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);
                  if (fHasLines) obj.lines = fLines;

                  if (typeof obj.baseHexagramName !== "string" || !obj.baseHexagramName.trim()) {
                    if (typeof f.baseHexagramName === "string" && f.baseHexagramName.trim()) {
                      obj.baseHexagramName = f.baseHexagramName.trim();
                    }
                  }
                  if (typeof obj.changedHexagramName !== "string" || !obj.changedHexagramName.trim()) {
                    if (typeof f.changedHexagramName === "string" && f.changedHexagramName.trim()) {
                      obj.changedHexagramName = f.changedHexagramName.trim();
                    }
                  }

                  // If fallback gave hexagram names but not lines, derive.
                  const baseName = typeof obj.baseHexagramName === "string" ? obj.baseHexagramName.trim() : "";
                  const changedName =
                    typeof obj.changedHexagramName === "string" ? obj.changedHexagramName.trim() : "";
                  const derived = baseName ? deriveLinesFromHexagramNames(baseName, changedName || undefined) : null;
                  if (derived && derived.length === 6) obj.lines = derived;
                }
              }
            } catch (e) {
              request.log.warn({ err: e }, "aiRecognize: liuyao image fallback pass failed");
            }
          }
        }
      }

      return result;
    },
  );
}
