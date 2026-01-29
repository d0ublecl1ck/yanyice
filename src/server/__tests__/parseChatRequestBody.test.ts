import { describe, expect, test } from "bun:test";

import { parseChatRequestBody } from "../gemini/chatRequest";

describe("parseChatRequestBody", () => {
  test("parses valid body", () => {
    const parsed = parseChatRequestBody({
      systemInstruction: "你是一位专业命理师。",
      messages: [
        { role: "user", text: "你好" },
        { role: "model", text: "请问想问什么？" },
      ],
    });

    expect(parsed).toEqual({
      systemInstruction: "你是一位专业命理师。",
      messages: [
        { role: "user", text: "你好" },
        { role: "model", text: "请问想问什么？" },
      ],
    });
  });

  test("rejects invalid roles or shapes", () => {
    expect(
      parseChatRequestBody({
        systemInstruction: "x",
        messages: [{ role: "assistant", text: "nope" }],
      }),
    ).toBeNull();

    expect(parseChatRequestBody({ systemInstruction: 1, messages: [] })).toBeNull();
    expect(parseChatRequestBody({ systemInstruction: "x", messages: "nope" })).toBeNull();
  });
});

