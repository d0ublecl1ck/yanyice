import { GoogleGenAI, Type, type GenerateContentResponse } from "@google/genai";
import { NextResponse } from "next/server";

import { parseExtractRequestBody } from "@/server/gemini/extractRequest";

export async function POST(req: Request) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API_KEY" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsedBody = parseExtractRequestBody(body);
  if (!parsedBody) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
  } as const;

  const contents =
    parsedBody.kind === "text"
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
    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("Gemini AI extraction failed:", error);
    return NextResponse.json(
      { error: "Gemini AI extraction failed" },
      { status: 500 },
    );
  }
}

