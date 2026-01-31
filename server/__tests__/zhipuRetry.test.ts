import { describe, expect, test } from "bun:test";
import type { AiVendor } from "@prisma/client";

import { zhipuChatJson } from "../src/ai/zhipu";

describe("zhipuChatJson retry", () => {
  test("retries on rate limit and eventually succeeds", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      void args;
      calls += 1;
      if (calls < 3) {
        return new Response(JSON.stringify({ error: { message: "当前API请求过多，请稍后重试。" } }), {
          status: 429,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":true}" } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const res = await zhipuChatJson({
        vendor: "zhipu" as AiVendor,
        apiKey: "test",
        model: "test",
        messages: [{ role: "user", content: "hi" }],
      });
      expect(res).toEqual({ ok: true });
      expect(calls).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
