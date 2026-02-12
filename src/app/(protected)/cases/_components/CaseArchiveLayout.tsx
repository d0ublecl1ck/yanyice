"use client";

import React from "react";
import Link from "next/link";

export type CaseArchiveTagOption = { tag: string; count: number };

export function CaseArchiveLayout({
  title,
  subtitle,
  resultCount,
  actionHref,
  actionLabel,
  actionClassName,
  actionIcon,
  searchIcon,
  search,
  onSearchChange,
  searchPlaceholder,
  tagOptions,
  activeTag,
  onActiveTagChange,
  children,
}: {
  title: string;
  subtitle: string;
  resultCount: number;
  actionHref: string;
  actionLabel: string;
  actionClassName: string;
  actionIcon: React.ReactNode;
  searchIcon: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  tagOptions?: CaseArchiveTagOption[];
  activeTag?: string | null;
  onActiveTagChange?: (value: string | null) => void;
  children: React.ReactNode;
}) {
  const shouldShowTags = (tagOptions?.length ?? 0) > 0;
  const canFilterByTags = shouldShowTags && activeTag !== undefined && onActiveTagChange != null;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">{title}</h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            {subtitle} ({resultCount})
          </p>
        </div>
        <Link href={actionHref} className={actionClassName}>
          {actionIcon}
          {actionLabel}
        </Link>
      </header>

      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B37D56]/40 group-focus-within:text-[#A62121] transition-colors">
          {searchIcon}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-white border border-[#B37D56]/10 pl-12 pr-6 py-3 outline-none focus:border-[#A62121] transition-all text-sm rounded-none shadow-sm"
        />
      </div>

      {shouldShowTags ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">标签筛选</p>
            {canFilterByTags && activeTag != null ? (
              <button
                type="button"
                onClick={() => onActiveTagChange?.(null)}
                className="text-[10px] font-bold tracking-widest text-[#2F2F2F]/30 hover:text-[#A62121] transition-colors"
              >
                清除筛选
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              aria-pressed={canFilterByTags ? activeTag == null : true}
              onClick={canFilterByTags ? () => onActiveTagChange?.(null) : undefined}
              className={[
                "text-[10px] px-2 py-1 border font-bold tracking-widest transition-colors rounded-[2px]",
                canFilterByTags && activeTag == null
                  ? "bg-black text-white border-black"
                  : "bg-white text-[#2F2F2F]/60 border-[#B37D56]/10 hover:border-[#A62121]/30 hover:text-[#A62121]",
              ].join(" ")}
            >
              全部
            </button>

            {tagOptions?.map(({ tag, count }) => {
              const isActive = canFilterByTags ? activeTag === tag : false;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isActive}
                  onClick={
                    canFilterByTags ? () => onActiveTagChange?.(isActive ? null : tag) : undefined
                  }
                  className={[
                    "text-[10px] px-2 py-1 border font-bold tracking-widest transition-colors flex items-center gap-1 rounded-[2px]",
                    isActive
                      ? "bg-[#A62121] text-white border-[#A62121]"
                      : "bg-white text-[#2F2F2F]/60 border-[#B37D56]/10 hover:border-[#A62121]/30 hover:text-[#A62121]",
                  ].join(" ")}
                >
                  {tag}
                  <span className={isActive ? "text-white/70" : "text-[#2F2F2F]/20"}>{count}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="border border-[#B37D56]/10 rounded-none shadow-sm overflow-hidden bg-[#B37D56]/10">
        {children}
      </div>
    </div>
  );
}
