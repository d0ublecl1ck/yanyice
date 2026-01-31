"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { getSelectTriggerClassName, type SelectAlign, type SelectOption, type SelectSize, type SelectVariant } from "@/components/Select";

const normalizeText = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，,。\.；;、]/g, "")
    .replace(/：/g, ":");

export function fuzzyMatchScore(target: string, query: string): number | null {
  const t = normalizeText(target);
  const q = normalizeText(query);
  if (!q) return 0;
  if (!t) return null;

  let ti = 0;
  let qi = 0;
  const positions: number[] = [];
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      positions.push(ti);
      qi++;
    }
    ti++;
  }
  if (qi !== q.length) return null;

  const start = positions[0] ?? 0;
  let gaps = 0;
  for (let i = 1; i < positions.length; i++) {
    gaps += Math.max(0, (positions[i] ?? 0) - (positions[i - 1] ?? 0) - 1);
  }
  const lengthPenalty = Math.max(0, t.length - q.length);
  return 10_000 - start * 10 - gaps * 3 - lengthPenalty;
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

export function SearchSelect<T extends string | number>({
  value,
  options,
  emptyLabel,
  placeholder = "请选择",
  searchPlaceholder = "搜索...",
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
  searchPlaceholder?: React.ReactNode;
  onValueChange?: (next: T | "") => void;
  variant?: SelectVariant;
  align?: SelectAlign;
  size?: SelectSize;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const valueKey = value === undefined ? "" : String(value);
  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === valueKey),
    [options, valueKey],
  );
  const display = selectedOption?.label ?? (valueKey === "" ? emptyLabel : undefined);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const scored = options
      .map((o) => {
        const labelText = typeof o.label === "string" ? o.label : String(o.value);
        const score = fuzzyMatchScore(labelText, query);
        return score === null ? null : { opt: o, score };
      })
      .filter(Boolean) as Array<{ opt: SelectOption<T>; score: number }>;
    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.opt);
  }, [options, query]);

  const listOptions = useMemo(() => {
    const items: Array<SelectOption<T | ""> & { __key: string }> = [];
    if (emptyLabel !== undefined) items.push({ value: "" as const, label: emptyLabel, __key: "" });
    for (const opt of filteredOptions) items.push({ ...opt, __key: String(opt.value) });
    return items;
  }, [emptyLabel, filteredOptions]);

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
    setQuery("");
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx =
      selectedIndex >= 0 && !listOptions[selectedIndex]?.disabled
        ? selectedIndex
        : findFirstEnabledIndex(listOptions);
    setActiveIndex(idx);
  }, [listOptions, open, selectedIndex]);

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
        <span className={display ? "" : "text-[#2F2F2F]/30"}>{display ?? placeholder}</span>
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
              const active = listOptions[activeIndex];
              if (!active || active.disabled) return;
              commit(active.value);
              return;
            }
          }}
        >
          <div className="px-3 py-2 border-b border-[#B37D56]/10">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-[#2F2F2F]/30" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={String(searchPlaceholder)}
                className="w-full bg-transparent outline-none text-[10px] chinese-font font-bold rounded-none"
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-auto">
            {listOptions.length === 0 ? (
              <div className="px-3 py-3 text-[10px] text-[#2F2F2F]/30 chinese-font font-bold">
                无匹配结果
              </div>
            ) : (
              listOptions.map((o, idx) => {
                const selected = o.__key === valueKey;
                const active = idx === activeIndex;
                return (
                  <button
                    key={o.__key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={o.disabled}
                    onPointerMove={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (o.disabled) return;
                      commit(o.value);
                    }}
                    className={getOptionClassName({ selected, disabled: Boolean(o.disabled), active })}
                  >
                    {o.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
