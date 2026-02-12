"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, FileText } from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import type { CaseFilter } from "@/lib/moduleParam";
import { recordEditHref } from "@/lib/caseLinks";
import { CreateLiuyaoRecordModal } from "./CreateLiuyaoRecordModal";

export function CaseAll({ initialFilter }: { initialFilter: CaseFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const records = useCaseStore((state) => state.records);
  const customers = useCustomerStore((state) => state.customers);

  const [filter, setFilter] = useState<CaseFilter>(initialFilter);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const initialCustomerId = useMemo(() => {
    const raw = searchParams.get("customerId") ?? "";
    return raw.trim() ? raw.trim() : undefined;
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("create") !== "liuyao") return;
    setIsCreateOpen(true);
  }, [searchParams]);

  const filteredRecords = records.filter((record) => {
    const matchesFilter = filter === "all" || record.module === filter;
    const customer = customers.find((c) => c.id === record.customerId);
    const customerName = record.customerName ?? customer?.name ?? "";
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      record.subject.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <CreateLiuyaoRecordModal
        open={isCreateOpen}
        initialCustomerId={initialCustomerId}
        onClose={() => {
          setIsCreateOpen(false);
          if (searchParams.get("create") === "liuyao") router.replace("/liuyao");
        }}
      />
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            咨询记录库
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Consultation Archives ({filteredRecords.length})
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
          type="button"
        >
          <Plus size={16} />
          新建记录
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B37D56]/40 group-focus-within:text-[#A62121] transition-colors"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索咨询主题或缘主姓名..."
            className="w-full bg-white border border-[#B37D56]/10 pl-12 pr-6 py-3 outline-none focus:border-[#A62121] transition-all text-sm rounded-none shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "liuyao", "bazi"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 text-xs font-bold tracking-widest border transition-all ${
                filter === f
                  ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                  : "bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]"
              }`}
            >
              {f === "all" ? "全部" : f === "liuyao" ? "六爻" : "八字"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#B37D56]/10 rounded-none shadow-sm overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-[#B37D56]/5">
            {filteredRecords
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((record) => {
                const customer = customers.find((c) => c.id === record.customerId);
                const displayCustomerName = record.customerName ?? customer?.name ?? "未知缘主";
                const href = recordEditHref(record.module, record.id);
                return (
                  <Link
                    key={record.id}
                    href={href}
                    className="flex items-center group hover:bg-[#FAF7F2] transition-all p-6"
                  >
                    <div className="w-12 h-12 bg-[#B37D56]/5 flex items-center justify-center shrink-0">
                      <FileText
                        size={20}
                        className="text-[#B37D56]/30 group-hover:text-[#A62121] transition-colors"
                      />
                    </div>
                    <div className="ml-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors">
                          {record.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest">
                            {displayCustomerName}
                          </span>
                          <span className="text-[10px] text-[#2F2F2F]/20">|</span>
                          <span className="text-[10px] text-[#2F2F2F]/30">
                            {record.module === "liuyao" ? "文王六爻" : "子平八字"}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="ml-6 text-[#2F2F2F]/10 group-hover:text-[#A62121] transition-all transform group-hover:translate-x-1"
                    />
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[#2F2F2F]/20 chinese-font italic">未找到匹配的卷宗记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
