import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { NextResponse } from "next/server";

import { parseChatRequestBody } from "@/server/gemini/chatRequest";

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

  const parsed = parseChatRequestBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = parsed.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents,
      config: { systemInstruction: parsed.systemInstruction },
    });

    return NextResponse.json({ text: response.text ?? "" }, { status: 200 });
  } catch (error) {
    console.error("Gemini chat failed:", error);
    return NextResponse.json({ error: "Gemini chat failed" }, { status: 500 });
  }
}

