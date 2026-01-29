"use client";

import React, { useMemo } from "react";

export type SelectVariant = "underline" | "box";
export type SelectAlign = "left" | "center";
export type SelectSize = "sm" | "md";

export type SelectOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export function getSelectClassName({
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
    "w-full outline-none transition-colors chinese-font font-bold disabled:opacity-50 disabled:cursor-not-allowed";
  const alignClass = align === "center" ? "text-center" : "";

  const variantClass =
    variant === "box"
      ? "bg-white border border-[#B37D56]/10 focus:border-[#A62121] rounded-[2px]"
      : "bg-transparent border-b border-[#2F2F2F]/10 focus:border-[#A62121] rounded-none";

  const sizeClass = size === "sm" ? "py-1 text-[10px]" : "py-2";

  return [common, alignClass, variantClass, sizeClass, className].filter(Boolean).join(" ");
}

export function Select<T extends string | number>({
  value,
  options,
  emptyLabel,
  onValueChange,
  variant,
  align,
  size,
  className,
  onChange,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  value: T | "" | undefined;
  options: Array<SelectOption<T>>;
  emptyLabel?: React.ReactNode;
  onValueChange?: (next: T | "") => void;
  variant?: SelectVariant;
  align?: SelectAlign;
  size?: SelectSize;
}) {
  const valueKey = value === undefined ? "" : String(value);

  const valueMap = useMemo(() => {
    const map = new Map<string, T>();
    for (const opt of options) map.set(String(opt.value), opt.value);
    return map;
  }, [options]);

  return (
    <select
      {...props}
      value={valueKey}
      onChange={(e) => {
        onChange?.(e);
        const nextKey = e.target.value;
        const mapped = valueMap.get(nextKey);
        onValueChange?.((mapped ?? nextKey) as T | "");
      }}
      className={getSelectClassName({ variant, align, size, className })}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

