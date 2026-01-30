"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, Hash } from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { newCaseHref, recordAnalysisHref, recordEditHref } from "@/lib/caseLinks";
import type { BaZiData } from "@/lib/types";
import { zodiacInfoFromBranch } from "@/lib/zodiac";
import { CreateBaziRecordModal } from "./CreateBaziRecordModal";
import { CaseArchiveLayout } from "./CaseArchiveLayout";

function BaziEightCharChops({ baziData }: { baziData?: BaZiData }) {
  if (!baziData) return null;

  const pillars = [
    { top: baziData.yearStem, bottom: baziData.yearBranch, label: "年柱" },
    { top: baziData.monthStem, bottom: baziData.monthBranch, label: "月柱" },
    { top: baziData.dayStem, bottom: baziData.dayBranch, label: "日柱" },
    { top: baziData.hourStem, bottom: baziData.hourBranch, label: "时柱" },
  ];

  const eightChars = pillars.map((p) => `${p.top}${p.bottom}`).join(" ");
  const chipClass =
    "w-7 h-7 rounded-full bg-[#B37D56]/70 text-white chinese-font font-bold text-[12px] leading-none flex items-center justify-center border border-black/5 group-hover:bg-[#A62121]/80 transition-colors";

  return (
    <div className="shrink-0" aria-label={`八字：${eightChars}`}>
      <div className="grid grid-cols-4 gap-x-1.5 gap-y-1">
        {pillars.map((p) => (
          <div key={p.label} className="flex flex-col items-center gap-1" aria-label={p.label}>
            <span className={chipClass}>{p.top}</span>
            <span className={chipClass}>{p.bottom}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseBazi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allRecords = useCaseStore((state) => state.records);
  const customers = useCustomerStore((state) => state.customers);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const records = useMemo(() => allRecords.filter((r) => r.module === "bazi"), [allRecords]);
  const isCreateOpen = searchParams.get("new") === "1";

  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const record of records) {
      for (const tag of record.tags ?? []) {
        const normalized = tag.trim();
        if (!normalized) continue;
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort(([aTag, aCount], [bTag, bCount]) => {
        if (bCount !== aCount) return bCount - aCount;
        return aTag.localeCompare(bTag);
      })
      .map(([tag, count]) => ({ tag, count }));
  }, [records]);

  const filteredRecords = records.filter((record) => {
    const customer = customers.find((c) => c.id === record.customerId);
    const q = search.trim().toLowerCase();
    const matchesTag = activeTag == null || (record.tags ?? []).includes(activeTag);
    return (
      matchesTag &&
      (q.length === 0 ||
        record.subject.toLowerCase().includes(q) ||
        (customer?.name.toLowerCase().includes(q) ?? false))
    );
  });

  const gridClassName = useMemo(() => {
    const count = filteredRecords.length;
    if (count === 1) return "grid grid-cols-1 gap-px";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-px";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-px";
  }, [filteredRecords.length]);

  const closeCreate = React.useCallback(() => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("new");
    qs.delete("customerId");
    const query = qs.toString();
    router.replace(query ? `/bazi?${query}` : "/bazi");
  }, [router, searchParams]);

  React.useEffect(() => {
    if (!isCreateOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreate();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCreateOpen, closeCreate]);

  return (
    <div>
      <CaseArchiveLayout
        title="八字案卷库"
        subtitle="Bazi Archives"
        resultCount={filteredRecords.length}
        actionHref={newCaseHref("bazi")}
        actionLabel="新建八字"
        actionClassName="flex items-center gap-2 px-6 py-2 bg-black text-white font-bold text-sm tracking-widest hover:bg-zinc-800 transition-all rounded-[2px]"
        actionIcon={<Plus size={16} />}
        searchIcon={<Search size={16} />}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索姓名或命例描述..."
        tagOptions={availableTags}
        activeTag={activeTag}
        onActiveTagChange={setActiveTag}
      >
        {filteredRecords.length > 0 ? (
          <div className={gridClassName}>
            {filteredRecords
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((record) => {
                const customer = customers.find((c) => c.id === record.customerId);
                const b = record.baziData;
                const zodiac = zodiacInfoFromBranch(b?.yearBranch);
                const editHref = recordEditHref("bazi", record.id);
                const analysisHref = recordAnalysisHref("bazi", record.id);
                return (
                  <div
                    key={record.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(analysisHref)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") router.push(analysisHref);
                    }}
                    className="bg-white flex items-start gap-4 group hover:bg-[#FAF7F2] transition-all p-6"
                  >
                    <div className="w-12 h-12 bg-[#B37D56]/5 flex items-center justify-center shrink-0">
                      {zodiac ? (
                        <Image
                          src={zodiac.iconSrc}
                          alt={`${b?.yearBranch}：${zodiac.nameCn}`}
                          width={24}
                          height={24}
                          className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <Hash
                          size={20}
                          className="text-[#B37D56]/30 group-hover:text-[#A62121] transition-colors"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors truncate">
                            {record.subject}
                          </h4>
                          {customer?.name && customer.name !== record.subject ? (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest">
                                {customer.name}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} />
                            {new Date(record.createdAt).toLocaleDateString()}
                          </div>
                          <BaziEightCharChops baziData={b} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {record.tags.length > 0 ? (
                            <>
                              {record.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-2 py-0.5 border border-[#B37D56]/10 bg-[#FAF7F2] text-[#2F2F2F]/60 font-bold tracking-widest rounded-[2px]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {record.tags.length > 3 ? (
                                <span className="text-[9px] px-2 py-0.5 border border-[#B37D56]/10 bg-white text-[#2F2F2F]/30 font-bold tracking-widest rounded-[2px]">
                                  +{record.tags.length - 3}
                                </span>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={analysisHref}
                            className="text-[9px] px-2 py-0.5 border border-black/10 text-[#2F2F2F]/60 font-bold hover:border-[#A62121]/30 hover:text-[#A62121] rounded-[2px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            排盘
                          </Link>
                          <Link
                            href={editHref}
                            className="text-[9px] px-2 py-0.5 border border-[#B37D56]/20 text-[#2F2F2F]/30 font-bold hover:border-[#A62121]/30 hover:text-[#A62121] rounded-[2px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            编辑
                          </Link>
                          <ChevronRight
                            size={16}
                            className="text-[#2F2F2F]/10 group-hover:text-[#A62121] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[#2F2F2F]/20 chinese-font italic">未找到匹配的八字卷宗</p>
          </div>
        )}
      </CaseArchiveLayout>

	      <CreateBaziRecordModal open={isCreateOpen} onClose={closeCreate} />
	    </div>
	  );
}
