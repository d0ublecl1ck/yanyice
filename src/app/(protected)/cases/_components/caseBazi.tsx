"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, Hash, X } from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { newCaseHref, recordAnalysisHref, recordEditHref } from "@/lib/caseLinks";
import { BaziEditView } from "../../bazi/_components/BaziEditView";

export function CaseBazi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allRecords = useCaseStore((state) => state.records);
  const customers = useCustomerStore((state) => state.customers);
  const [search, setSearch] = useState("");

  const records = useMemo(() => allRecords.filter((r) => r.module === "bazi"), [allRecords]);
  const isCreateOpen = searchParams.get("new") === "1";

  const filteredRecords = records.filter((record) => {
    const customer = customers.find((c) => c.id === record.customerId);
    const q = search.trim().toLowerCase();
    return (
      q.length === 0 ||
      record.subject.toLowerCase().includes(q) ||
      (customer?.name.toLowerCase().includes(q) ?? false)
    );
  });

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
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            八字案卷库
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Bazi Archives ({filteredRecords.length})
          </p>
        </div>
        <Link
          href={newCaseHref("bazi")}
          className="flex items-center gap-2 px-6 py-2 bg-black text-white font-bold text-sm tracking-widest hover:bg-zinc-800 transition-all rounded-[2px]"
        >
          <Plus size={16} />
          新建八字
        </Link>
      </header>

      <div className="relative group">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B37D56]/40 group-focus-within:text-[#A62121] transition-colors"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名或命例描述..."
          className="w-full bg-white border border-[#B37D56]/10 pl-12 pr-6 py-3 outline-none focus:border-[#A62121] transition-all text-sm rounded-none shadow-sm"
        />
      </div>

      <div className="border border-[#B37D56]/10 rounded-none shadow-sm overflow-hidden bg-[#B37D56]/10">
        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
            {filteredRecords
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((record) => {
                const customer = customers.find((c) => c.id === record.customerId);
                const b = record.baziData;
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
                      <Hash
                        size={20}
                        className="text-[#B37D56]/30 group-hover:text-[#A62121] transition-colors"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors truncate">
                            {record.subject}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest">
                              {customer?.name || "散客"}
                            </span>
                            <span className="text-[10px] text-[#2F2F2F]/20">|</span>
                            <span className="text-[10px] text-[#2F2F2F]/30">
                              {b?.yearStem}
                              {b?.yearBranch} {b?.monthStem}
                              {b?.monthBranch} {b?.dayStem}
                              {b?.dayBranch} {b?.hourStem}
                              {b?.hourBranch}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
                          <Calendar size={12} />
                          {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={analysisHref}
                            className="text-[9px] px-2 py-0.5 border border-black/10 text-[#2F2F2F]/60 font-bold hover:border-[#A62121]/30 hover:text-[#A62121]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            排盘
                          </Link>
                          <Link
                            href={editHref}
                            className="text-[9px] px-2 py-0.5 border border-[#B37D56]/20 text-[#2F2F2F]/30 font-bold hover:border-[#A62121]/30 hover:text-[#A62121]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            编辑
                          </Link>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[#2F2F2F]/10 group-hover:text-[#A62121] transition-all"
                        />
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
      </div>

      {isCreateOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="新建八字"
          className="fixed inset-0 z-[60] bg-black/40 p-6 flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCreate();
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-[#FAF7F2] border border-[#B37D56]/20 rounded-[4px] shadow-none relative">
            <button
              type="button"
              onClick={closeCreate}
              className="absolute top-4 right-4 w-10 h-10 border border-[#B37D56]/20 bg-white hover:bg-[#FAF7F2] transition-colors rounded-[2px] flex items-center justify-center"
              aria-label="关闭"
            >
              <X size={18} className="text-[#2F2F2F]/60" />
            </button>
            <div className="overflow-y-auto max-h-[90vh] p-8 pt-10">
              <BaziEditView />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
