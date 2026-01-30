const FLASH_CLASSES = [
  "ring-2",
  "ring-[#A62121]/30",
  "bg-[#A62121]/[0.03]",
  "transition-colors",
] as const;

export function scrollAndFlash(el: HTMLElement | null, ms = 1600) {
  if (!el) return;
  try {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    // ignore
  }
  for (const cls of FLASH_CLASSES) el.classList.add(cls);
  window.setTimeout(() => {
    for (const cls of FLASH_CLASSES) el.classList.remove(cls);
  }, ms);
}

