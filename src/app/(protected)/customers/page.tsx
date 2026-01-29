"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Calendar, ChevronRight, History, Search } from "lucide-react";

import { useCustomerStore } from "@/stores/useCustomerStore";

export default function Page() {
  const customers = useCustomerStore((state) => state.customers);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const genderFilters = [
    { id: "all", label: "全部" },
    { id: "male", label: "乾造" },
    { id: "female", label: "坤造" },
  ] as const;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.includes(search) || (c.phone && c.phone.includes(search));
    const matchesGender = genderFilter === "all" || c.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            客户名录
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Inscribed Customers ({filteredCustomers.length})
          </p>
        </div>
        <Link
          href="/customers/new"
          className="px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
        >
          登记新客户
        </Link>
      </header>

      <div className="space-y-4">
        <div className="relative group max-w-md">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B37D56]/40 group-focus-within:text-[#A62121] transition-colors"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名或联系方式..."
            className="w-full bg-white border border-[#B37D56]/10 pl-12 pr-6 py-3 outline-none focus:border-[#A62121] transition-all text-sm rounded-[4px] shadow-none"
          />
        </div>

        <div className="flex gap-2">
          {genderFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setGenderFilter(f.id)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-widest border transition-all ${
                genderFilter === f.id
                  ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                  : "bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => router.push(`/customers/view/${customer.id}`)}
              className="group bg-white border border-[#B37D56]/15 p-6 hover:border-[#A62121] transition-all relative overflow-hidden shadow-none cursor-pointer hover:-translate-y-1 rounded-[4px]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <User size={64} />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-[#2F2F2F] chinese-font">
                      {customer.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 border border-[#B37D56]/20 text-[#B37D56] font-bold">
                      {customer.gender === "male"
                        ? "乾造"
                        : customer.gender === "female"
                          ? "坤造"
                          : "不详"}
                    </span>
                  </div>
                  <Link
                    href={`/customers/history/${customer.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-[#B37D56]/40 hover:text-[#A62121] hover:bg-[#A62121]/5 transition-all rounded-[2px]"
                    title="查看历程纪"
                  >
                    <History size={18} />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] bg-[#FAF7F2] text-[#B37D56] px-2 py-0.5 border border-[#B37D56]/10 rounded-[1px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="pt-4 border-t border-[#B37D56]/5 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#2F2F2F]/30 uppercase font-bold tracking-tighter">
                    <Calendar size={12} />
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#A62121] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    查看档案
                    <ChevronRight
                      size={14}
                      className="transform group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border border-dashed border-[#B37D56]/20 rounded-[4px]">
          <p className="text-[#2F2F2F]/20 chinese-font italic">册中尚无匹配记录</p>
        </div>
      )}
    </div>
  );
}
