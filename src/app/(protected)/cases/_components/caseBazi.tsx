"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, ChevronRight, Hash } from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { newCaseHref } from "@/lib/caseLinks";

export function CaseBazi() {
  const allRecords = useCaseStore((state) => state.records);
  const customers = useCustomerStore((state) => state.customers);
  const [search, setSearch] = useState("");

  const records = useMemo(() => allRecords.filter((r) => r.module === "bazi"), [allRecords]);

  const filteredRecords = records.filter((record) => {
    const customer = customers.find((c) => c.id === record.customerId);
    const q = search.trim().toLowerCase();
    return (
      q.length === 0 ||
      record.subject.toLowerCase().includes(q) ||
      (customer?.name.toLowerCase().includes(q) ?? false)
    );
  });

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

      <div className="bg-white border border-[#B37D56]/10 rounded-none shadow-sm overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-[#B37D56]/5">
            {filteredRecords
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((record) => {
                const customer = customers.find((c) => c.id === record.customerId);
                const b = record.baziData;
                return (
                  <Link
                    key={record.id}
                    href={`/bazi/edit/${encodeURIComponent(record.id)}`}
                    className="flex items-center group hover:bg-[#FAF7F2] transition-all p-6"
                  >
                    <div className="w-12 h-12 bg-[#B37D56]/5 flex items-center justify-center shrink-0">
                      <Hash
                        size={20}
                        className="text-[#B37D56]/30 group-hover:text-[#A62121] transition-colors"
                      />
                    </div>
                    <div className="ml-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors">
                          {record.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
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
                      <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] px-2 py-0.5 border border-[#B37D56]/20 text-[#2F2F2F]/30 font-bold">
                          查看详情
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="ml-6 text-[#2F2F2F]/10 group-hover:text-[#A62121] transition-all"
                    />
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[#2F2F2F]/20 chinese-font italic">未找到匹配的八字卷宗</p>
          </div>
        )}
      </div>
    </div>
  );
}
