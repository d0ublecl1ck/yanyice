import { describe, expect, test } from "bun:test";

describe("CreateLiuyaoRecordModal style", () => {
  test("aligns overlay + width + scrollbar behavior with customer modal conventions", async () => {
    const modalSource = await Bun.file(new URL("../../../../../components/ui/Modal.tsx", import.meta.url)).text();
    const source = await Bun.file(new URL("../CreateLiuyaoRecordModal.tsx", import.meta.url)).text();

    expect(modalSource).toContain(
      'className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"',
    );
    expect(source).not.toContain("lg:grid-cols-5");
    expect(source).not.toContain("lg:col-span-2");
    expect(source).toContain("hideScrollbar");
    expect(source).toContain("ModalPrimaryButton");
    expect(modalSource).toContain("[&::-webkit-scrollbar]:hidden");
  });
});
