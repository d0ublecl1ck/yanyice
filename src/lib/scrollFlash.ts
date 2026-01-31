export function scrollAndFlash(el: HTMLElement | null, ms = 1600) {
  if (!el) return;
  try {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    // ignore
  }

  // Prefer native focus styling over artificial highlights to match the dossier aesthetic.
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    el.isContentEditable
  ) {
    try {
      el.focus({ preventScroll: true });
    } catch {
      // ignore
    }
    window.setTimeout(() => {
      try {
        el.blur();
      } catch {
        // ignore
      }
    }, ms);
  }
}
