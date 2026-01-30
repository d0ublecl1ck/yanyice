import { describe, expect, test } from "bun:test";

describe("CaseBazi edit modal", () => {
  test("shares modal styling conventions with create modal", async () => {
    const modalSource = await Bun.file(
      new URL("../../../../../components/ui/Modal.tsx", import.meta.url),
    ).text();
    const baziSource = await Bun.file(new URL("../EditBaziRecordModal.tsx", import.meta.url)).text();

    expect(modalSource).toContain(
      'className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"',
    );
    expect(modalSource).toContain("rounded-[4px]");
    expect(modalSource).toContain("border border-[#B37D56]/20");
    expect(modalSource).toContain("text-xs font-bold tracking-widest chinese-font text-[#2F2F2F]");
    expect(modalSource).toContain("[&::-webkit-scrollbar]:hidden");

    expect(baziSource).toContain('title="编辑八字"');
    expect(baziSource).toContain("hideScrollbar");
  });
});

