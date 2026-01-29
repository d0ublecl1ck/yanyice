"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, ChevronRight, FileText } from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { newCaseHref, recordEditHref } from "@/lib/caseLinks";

export function CaseLiuyao() {
  const records = useCaseStore((state) =>
    state.records.filter((r) => r.module === "liuyao"),
  );
  const customers = useCustomerStore((state) => state.customers);
  const [search, setSearch] = useState("");

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
            六爻卦例库
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Liuyao Archives ({filteredRecords.length})
          </p>
        </div>
        <Link
          href={newCaseHref("liuyao")}
          className="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
        >
          <Plus size={16} />
          新建卦例
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
          placeholder="搜索卦例主题或客户姓名..."
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
                    <div className="ml-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors">
                          {record.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest">
                            {customer?.name || "未知客户"}
                          </span>
                          <span className="text-[10px] text-[#2F2F2F]/20">|</span>
                          <span className="text-[10px] text-[#2F2F2F]/30">文王六爻</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[9px] px-2 py-0.5 border font-bold ${
                            record.verifiedStatus === "accurate"
                              ? "border-[#8DA399] text-[#8DA399]"
                              : "border-[#B37D56]/20 text-[#2F2F2F]/30"
                          }`}
                        >
                          {record.verifiedStatus === "accurate" ? "已反馈: 准确" : "未反馈"}
                        </span>
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
            <p className="text-[#2F2F2F]/20 chinese-font italic">未找到匹配的六爻卦例</p>
          </div>
        )}
      </div>
    </div>
  );
}

