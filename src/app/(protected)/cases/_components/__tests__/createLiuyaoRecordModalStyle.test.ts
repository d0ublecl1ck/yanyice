import { describe, expect, test } from "bun:test";

describe("CreateLiuyaoRecordModal style", () => {
  test("aligns overlay + width + scrollbar behavior with customer modal conventions", async () => {
    const source = await Bun.file(new URL("../CreateLiuyaoRecordModal.tsx", import.meta.url)).text();

    expect(source).toContain(
      'className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"',
    );
    expect(source).toContain("max-w-md");
    expect(source).toContain("max-h-[90vh]");
    expect(source).toContain("flex flex-col");
    expect(source).toContain("min-h-0 flex-1 overflow-y-auto p-6");
    expect(source).toContain("[scrollbar-width:none]");
    expect(source).toContain("[&::-webkit-scrollbar]:hidden");
  });
});

