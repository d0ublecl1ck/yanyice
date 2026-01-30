"use client";

import React from "react";

export type ContextMenuItem = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

export function ContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState({ x, y });

  React.useEffect(() => {
    if (!open) return;
    setPos({ x, y });
  }, [open, x, y]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    if (!el) return;

    const padding = 8;
    const rect = el.getBoundingClientRect();
    const maxX = Math.max(padding, window.innerWidth - padding - rect.width);
    const maxY = Math.max(padding, window.innerHeight - padding - rect.height);

    setPos((p) => ({
      x: Math.min(p.x, maxX),
      y: Math.min(p.y, maxY),
    }));
  }, [open, items.length]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onWindowEvent = () => onClose();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onWindowEvent);
    window.addEventListener("scroll", onWindowEvent, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onWindowEvent);
      window.removeEventListener("scroll", onWindowEvent, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200]" onMouseDown={onClose} onContextMenu={onClose}>
      <div
        ref={menuRef}
        className="absolute min-w-[160px] bg-white border border-[#B37D56]/20 shadow-2xl rounded-[4px] overflow-hidden"
        style={{ left: pos.x, top: pos.y }}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {items.map((item) => {
            const base =
              "w-full text-left px-3 py-2 text-xs font-bold tracking-widest chinese-font transition-colors";
            const normal = item.destructive
              ? "text-[#A62121] hover:bg-[#A62121]/5"
              : "text-[#2F2F2F] hover:bg-[#FAF7F2]";
            const disabled = "text-[#2F2F2F]/20 cursor-not-allowed hover:bg-transparent";

            return (
              <button
                key={item.key}
                type="button"
                disabled={item.disabled}
                className={`${base} ${item.disabled ? disabled : normal}`}
                onClick={async () => {
                  if (item.disabled) return;
                  onClose();
                  await item.onSelect();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

