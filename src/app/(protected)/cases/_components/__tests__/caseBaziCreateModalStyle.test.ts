import { describe, expect, test } from "bun:test";

describe("CaseBazi create modal", () => {
  test("aligns overlay + container styling with customer modal conventions", async () => {
    const source = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();

    expect(source).toContain(
      'className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"',
    );
    expect(source).toContain("max-w-4xl");
    expect(source).toContain("rounded-[4px]");
    expect(source).toContain("border border-[#B37D56]/20");
    expect(source).toContain('className="min-h-0 flex-1 overflow-y-auto p-6"');
  });
});
