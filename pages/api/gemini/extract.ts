import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

type ExtractRequestBody =
  | { text: string }
  | { image: { data: string; mimeType: string } };

export function parseExtractRequestBody(body: unknown):
  | { kind: "text"; text: string }
  | { kind: "image"; image: { data: string; mimeType: string } }
  | null {
  if (typeof body !== "object" || body === null) return null;
  const anyBody = body as any;

  if (typeof anyBody.text === "string") {
    return { kind: "text", text: anyBody.text };
  }

  if (
    typeof anyBody.image?.data === "string" &&
    typeof anyBody.image?.mimeType === "string"
  ) {
    return {
      kind: "image",
      image: { data: anyBody.image.data, mimeType: anyBody.image.mimeType },
    };
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing API_KEY" });
  }

  const parsedBody = parseExtractRequestBody(req.body as ExtractRequestBody);
  if (!parsedBody) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    你是一个专业的六爻排盘助手。你的任务是从用户的文本描述或卦例图片中提取出结构化的六爻数据。
    
    六爻数据包括：
    1. 问事主题 (subject)
    2. 6个爻的状态 (lines): 0=少阳(—), 1=少阴(--), 2=老阳(— O), 3=老阴(-- X)。顺序必须是从下往上（初爻到上爻）。
    3. 月建 (monthBranch) 和 日辰 (dayBranch) 如：寅月 甲辰日。
    
    返回 JSON 格式。
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      lines: {
        type: Type.ARRAY,
        items: { type: Type.INTEGER },
        description: "从初爻到上爻的爻值 (0-3)",
      },
      monthBranch: { type: Type.STRING },
      dayBranch: { type: Type.STRING },
    },
    required: ["lines"],
  };

  const contents = parsedBody.kind === "text"
    ? parsedBody.text
    : {
        parts: [
          {
            inlineData: {
              data: parsedBody.image.data,
              mimeType: parsedBody.image.mimeType,
            },
          },
          { text: "请从这张六爻排盘图中提取信息" },
        ],
      };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Gemini AI extraction failed:", error);
    return res.status(500).json({ error: "Gemini AI extraction failed" });
  }
}
