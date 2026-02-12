import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("case archive context menu", () => {
  test("bazi archive cards support right-click menu actions", async () => {
    const source = await readFile("src/app/(protected)/cases/_components/caseBazi.tsx", "utf8");
    expect(source).toContain("onContextMenu={(e) => {");
    expect(source).toContain("<ContextMenu");
    expect(source).toContain('"置顶"');
    expect(source).toContain('"取消置顶"');
    expect(source).toContain('label: "删除"');
    expect(source).toContain('label: "编辑"');
  });

  test("liuyao archive cards support right-click menu actions", async () => {
    const source = await readFile("src/app/(protected)/cases/_components/caseLiuyao.tsx", "utf8");
    expect(source).toContain("onContextMenu={(e) => {");
    expect(source).toContain("<ContextMenu");
    expect(source).toContain('"置顶"');
    expect(source).toContain('"取消置顶"');
    expect(source).toContain('label: "删除"');
    expect(source).toContain('label: "编辑"');
  });
});

