"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SelectVariant = "underline" | "box";
export type SelectAlign = "left" | "center";
export type SelectSize = "sm" | "md";

export type SelectOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export function getSelectTriggerClassName({
  variant = "underline",
  align = "left",
  size = "md",
  className = "",
}: {
  variant?: SelectVariant;
  align?: SelectAlign;
  size?: SelectSize;
  className?: string;
}) {
  const common =
    "w-full flex items-center justify-between gap-2 outline-none transition-colors chinese-font font-bold disabled:opacity-50 disabled:cursor-not-allowed";
  const alignClass = align === "center" ? "text-center justify-center" : "";

  const variantClass =
    variant === "box"
      ? "bg-white border border-[#B37D56]/10 focus:border-[#A62121] rounded-[2px]"
      : "bg-transparent border-b border-[#2F2F2F]/10 focus:border-[#A62121] rounded-none";

  const sizeClass = size === "sm" ? "py-1 text-[10px]" : "py-2";

  return [common, alignClass, variantClass, sizeClass, className].filter(Boolean).join(" ");
}

function getMenuClassName({ className = "" }: { className?: string }) {
  return [
    "bg-white border border-[#B37D56]/20 shadow-none rounded-[4px] overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function getOptionClassName({
  selected,
  disabled,
  active,
}: {
  selected: boolean;
  disabled: boolean;
  active: boolean;
}) {
  return [
    "w-full text-left px-3 py-2 text-[10px] chinese-font font-bold transition-colors",
    disabled ? "text-[#2F2F2F]/20 cursor-not-allowed" : "text-[#2F2F2F] hover:bg-black/[0.02]",
    selected ? "bg-[#FAF7F2] text-[#A62121]" : "",
    active ? "outline-none ring-1 ring-inset ring-[#A62121]/30" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function findFirstEnabledIndex<T extends string | number>(options: Array<SelectOption<T>>) {
  return options.findIndex((o) => !o.disabled);
}

function findNextEnabledIndex<T extends string | number>(
  options: Array<SelectOption<T>>,
  start: number,
  dir: 1 | -1,
) {
  const n = options.length;
  if (n === 0) return -1;
  for (let step = 1; step <= n; step++) {
    const idx = (start + dir * step + n) % n;
    if (!options[idx]?.disabled) return idx;
  }
  return -1;
}

export function Select<T extends string | number>({
  value,
  options,
  emptyLabel,
  placeholder = "请选择",
  onValueChange,
  variant = "underline",
  align = "left",
  size = "md",
  className,
  disabled,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> & {
  value: T | "" | undefined;
  options: Array<SelectOption<T>>;
  emptyLabel?: React.ReactNode;
  placeholder?: React.ReactNode;
  onValueChange?: (next: T | "") => void;
  variant?: SelectVariant;
  align?: SelectAlign;
  size?: SelectSize;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const valueKey = value === undefined ? "" : String(value);
  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === valueKey),
    [options, valueKey],
  );
  const display = selectedOption?.label ?? (valueKey === "" ? emptyLabel : undefined);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const listOptions = useMemo(() => {
    const items: Array<SelectOption<T | ""> & { __key: string }> = [];
    if (emptyLabel !== undefined) items.push({ value: "" as const, label: emptyLabel, __key: "" });
    for (const opt of options) items.push({ ...opt, __key: String(opt.value) });
    return items;
  }, [emptyLabel, options]);

  const selectedIndex = useMemo(
    () => listOptions.findIndex((o) => o.__key === valueKey),
    [listOptions, valueKey],
  );

  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        left: r.left,
        top: r.bottom + 6,
        width: r.width,
        zIndex: 260,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx =
      selectedIndex >= 0 && !listOptions[selectedIndex]?.disabled
        ? selectedIndex
        : findFirstEnabledIndex(listOptions);
    setActiveIndex(idx);
  }, [open, selectedIndex, listOptions]);

  const commit = (next: T | "") => {
    onValueChange?.(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        {...props}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={getSelectTriggerClassName({ variant, align, size, className })}
      >
        <span className={display ? "" : "text-[#2F2F2F]/30"}>
          {display ?? placeholder}
        </span>
        <ChevronDown size={14} className="text-[#2F2F2F]/40 pointer-events-none" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={menuStyle}
          role="listbox"
          tabIndex={-1}
          className={getMenuClassName({})}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((cur) => {
                const start = cur >= 0 ? cur : 0;
                return findNextEnabledIndex(listOptions, start, 1);
              });
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((cur) => {
                const start = cur >= 0 ? cur : 0;
                return findNextEnabledIndex(listOptions, start, -1);
              });
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const opt = listOptions[activeIndex];
              if (!opt || opt.disabled) return;
              commit(opt.value as T | "");
            }
          }}
        >
          <div className="max-h-72 overflow-auto py-1">
            {listOptions.map((opt, idx) => {
              const key = opt.__key;
              const isSelected = key === valueKey;
              const isDisabled = Boolean(opt.disabled);
              const isActive = idx === activeIndex;
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isDisabled}
                  className={getOptionClassName({
                    selected: isSelected,
                    disabled: isDisabled,
                    active: isActive,
                  })}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    if (isDisabled) return;
                    commit(opt.value as T | "");
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

