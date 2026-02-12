import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { getUserAiApiKey, getUserAiConfig } from "../ai/userAiConfig";
import { aiChatJson } from "../ai/chat";
import { deriveLinesFromHexagramNames, parseHexagramPairFromText } from "../liuyao/recognitionHexagram";
import { parseLiuyaoIsoFromText } from "../liuyao/recognitionTime";

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const liuyaoFallbackFromImageInstruction = `
你是一个专门从六爻截图中“抠字段”的识别器。
目标：只做信息抽取，用于填表；允许多次抽取补全：本次能确定哪项就输出哪项；看不到就不要输出该字段；不要编造。

请尽量从图片里提取（任意项即可）：
1) time.gregorian：{ date:"YYYY-MM-DD", time:"HH:mm", timezone:"UTC+8"(可省略) }
2) time.ganzhi：{ year, month, day, hour }（可只给部分）
3) pan.hexagram：{ original:"本卦名", changed:"变卦名"(可省略) }
4) pan.lines：6个爻，从初爻(最下)到上爻(最上)，每个值只能是：老阴/老阳/少阴/少阳

只输出 JSON，不要输出额外文字。
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
你是“六爻盘信息抽取助手”。目标：从用户提供的文字与/或图片中抽取可用于填表的信息。
允许多次抽取补全：本次能确定哪项就输出哪项；看不到就不要输出该字段；不要编造。

请尽量抽取（任意项即可）：
1) time（时间提取，支持两类）
   - time.gregorian：{ date:"YYYY-MM-DD", time:"HH:mm", timezone:"UTC+8"(可省略) }
   - time.ganzhi：{ year, month, day, hour }（可只给部分）
2) pan（盘面提取，两种方式任选其一或同时给出）
   - pan.lines：6个爻，从初爻(最下)到上爻(最上)，每个值只能是：老阴/老阳/少阴/少阳
   - pan.hexagram：{ original:"本卦名", changed:"变卦名"(可省略) }
3) subject：问事描述（可省略）
4) gender：只在输入明确出现时提取；输出只允许：男 / 女 / 不详
5) topic：从问事语境归类（如：感情/婚姻、寻物、事业、财运、健康、学业、出行、诉讼、家宅、其他）
6) tags：只输出 1 个 tag，格式必须为「xx卦」（例如：感情卦 / 寻物卦 / 事业卦 / 财运卦 / 健康卦 / 学业卦 / 出行卦 / 诉讼卦 / 家宅卦 / 其他卦）

输出要求：
- 只输出 JSON，不要输出额外文字。
- 缺失字段不要输出（不要填 null）。
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
        response: { 200: Type.Any(), 400: ErrorResponse, 401: ErrorResponse, 429: ErrorResponse },
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

      let result: unknown;
      try {
        result = await aiChatJson({
          vendor: cfg.vendor,
          apiKey,
          model: cfg.model.trim(),
          messages: [
            { role: "system", content: instructionByTarget[body.target] },
            { role: "user", content: parts },
          ],
        });
      } catch (e) {
        const err = e as { code?: string; statusCode?: number; message?: string };
        if (err?.statusCode === 429 || err?.code === "ZHIPU_RATE_LIMIT" || err?.code === "OPENAI_RATE_LIMIT") {
          request.log.warn({ err }, "aiRecognize: upstream rate limited");
          return reply
            .status(429)
            .send({ code: "AI_RATE_LIMIT", message: "当前 AI 请求过多，系统已自动重试仍失败，请稍后再试" });
        }
        throw e;
      }

      if (body.target === "liuyao" && result && typeof result === "object" && !Array.isArray(result)) {
        const obj = result as Record<string, unknown>;
        const hasIso = typeof obj.iso === "string" && obj.iso.trim().length > 0;
        const hasSolar = obj.solar && typeof obj.solar === "object";

        const timeObj = obj.time && typeof obj.time === "object" ? (obj.time as Record<string, unknown>) : null;
        const gregorianObj =
          timeObj?.gregorian && typeof timeObj.gregorian === "object"
            ? (timeObj.gregorian as Record<string, unknown>)
            : null;
        const hasGregorian =
          Boolean(gregorianObj) &&
          typeof gregorianObj?.date === "string" &&
          Boolean(gregorianObj.date.trim()) &&
          typeof gregorianObj?.time === "string" &&
          Boolean(gregorianObj.time.trim());
        const ganzhiObj =
          timeObj?.ganzhi && typeof timeObj.ganzhi === "object" ? (timeObj.ganzhi as Record<string, unknown>) : null;
        const hasGanzhi =
          Boolean(ganzhiObj) &&
          ["year", "month", "day", "hour"].some((k) => typeof ganzhiObj?.[k] === "string" && String(ganzhiObj[k]).trim());

        const hasAnyTime = hasIso || hasSolar || hasGregorian || hasGanzhi;

        if (trimmedText && !hasAnyTime) {
          const fallbackIso = parseLiuyaoIsoFromText(trimmedText);
          if (fallbackIso) obj.iso = fallbackIso;
        }

        const pan = obj.pan && typeof obj.pan === "object" ? (obj.pan as Record<string, unknown>) : null;
        const panHex =
          pan?.hexagram && typeof pan.hexagram === "object" ? (pan.hexagram as Record<string, unknown>) : null;
        const panBase = typeof panHex?.original === "string" ? panHex.original.trim() : "";
        const panChanged = typeof panHex?.changed === "string" ? panHex.changed.trim() : "";
        if ((!obj.baseHexagramName || typeof obj.baseHexagramName !== "string" || !obj.baseHexagramName.trim()) && panBase) {
          obj.baseHexagramName = panBase;
        }
        if (
          (!obj.changedHexagramName || typeof obj.changedHexagramName !== "string" || !obj.changedHexagramName.trim()) &&
          panChanged
        ) {
          obj.changedHexagramName = panChanged;
        }

        const lines = obj.lines;
        const hasLines =
          Array.isArray(lines) && lines.length === 6 && lines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);

        if (!hasLines && Array.isArray(pan?.lines) && pan.lines.length === 6 && pan.lines.every((v) => typeof v === "string")) {
          const map: Record<string, 0 | 1 | 2 | 3> = { 少阳: 0, 少阴: 1, 老阳: 2, 老阴: 3 };
          const mapped = (pan.lines as string[]).map((raw) => map[raw.trim().replace(/（.*?）/g, "").replace(/\s+/g, "")]);
          const ok = mapped.length === 6 && mapped.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);
          if (ok) obj.lines = mapped;
        }

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
          const afterTimeObj = obj.time && typeof obj.time === "object" ? (obj.time as Record<string, unknown>) : null;
          const afterGregorian =
            afterTimeObj?.gregorian && typeof afterTimeObj.gregorian === "object"
              ? (afterTimeObj.gregorian as Record<string, unknown>)
              : null;
          const afterHasGregorian =
            Boolean(afterGregorian) &&
            typeof afterGregorian?.date === "string" &&
            Boolean(String(afterGregorian.date).trim()) &&
            typeof afterGregorian?.time === "string" &&
            Boolean(String(afterGregorian.time).trim());
          const afterGanzhi =
            afterTimeObj?.ganzhi && typeof afterTimeObj.ganzhi === "object"
              ? (afterTimeObj.ganzhi as Record<string, unknown>)
              : null;
          const afterHasGanzhi =
            Boolean(afterGanzhi) &&
            ["year", "month", "day", "hour"].some(
              (k) => typeof afterGanzhi?.[k] === "string" && String(afterGanzhi[k]).trim(),
            );
          const afterDeriveHasLines =
            Array.isArray(obj.lines) &&
            obj.lines.length === 6 &&
            obj.lines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);

          const needsTime = !afterTextFallbackHasIso && !afterTextFallbackHasSolar && !afterHasGregorian && !afterHasGanzhi;
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
              const fallback = await aiChatJson({
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
                  if (!obj.time && f.time && typeof f.time === "object") obj.time = f.time;
                }

                if (!afterDeriveHasLines) {
                  const fLines = f.lines;
                  const fHasLines =
                    Array.isArray(fLines) &&
                    fLines.length === 6 &&
                    fLines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3);
                  if (fHasLines) obj.lines = fLines;

                  const fPan = f.pan && typeof f.pan === "object" ? (f.pan as Record<string, unknown>) : null;
                  const fPanHex =
                    fPan?.hexagram && typeof fPan.hexagram === "object" ? (fPan.hexagram as Record<string, unknown>) : null;
                  const fPanBase = typeof fPanHex?.original === "string" ? fPanHex.original.trim() : "";
                  const fPanChanged = typeof fPanHex?.changed === "string" ? fPanHex.changed.trim() : "";

                  if (typeof obj.baseHexagramName !== "string" || !obj.baseHexagramName.trim()) {
                    if (typeof f.baseHexagramName === "string" && f.baseHexagramName.trim()) {
                      obj.baseHexagramName = f.baseHexagramName.trim();
                    } else if (fPanBase) {
                      obj.baseHexagramName = fPanBase;
                    }
                  }
                  if (typeof obj.changedHexagramName !== "string" || !obj.changedHexagramName.trim()) {
                    if (typeof f.changedHexagramName === "string" && f.changedHexagramName.trim()) {
                      obj.changedHexagramName = f.changedHexagramName.trim();
                    } else if (fPanChanged) {
                      obj.changedHexagramName = fPanChanged;
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
