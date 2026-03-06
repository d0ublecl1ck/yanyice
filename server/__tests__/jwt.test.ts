import { describe, expect, it } from "bun:test";

import { signAccessToken, verifyAccessToken } from "../src/jwt";

describe("jwt helpers", () => {
  it("signs and verifies HS256 access token", () => {
    const token = signAccessToken({ sub: "user_123" }, { secret: "test-secret" });
    const payload = verifyAccessToken(token, { secret: "test-secret" });
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user_123");
  });

  it("rejects token with wrong secret", () => {
    const token = signAccessToken({ sub: "user_456" }, { secret: "secret-a" });
    const payload = verifyAccessToken(token, { secret: "secret-b" });
    expect(payload).toBeNull();
  });
});

