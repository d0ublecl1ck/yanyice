import { describe, expect, test } from "bun:test";

describe("liuyao create flow navigation", () => {
  test("does not redirect to /cases/edit after creating liuyao", async () => {
    const modalSource = await Bun.file(new URL("../CreateLiuyaoRecordModal.tsx", import.meta.url)).text();
    const caseAllSource = await Bun.file(new URL("../caseAll.tsx", import.meta.url)).text();

    expect(modalSource).not.toContain("recordEditHref(");
    expect(modalSource).not.toContain("router.push(");
    expect(caseAllSource).toContain('router.replace("/liuyao")');
  });
});

