"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  ShieldCheck,
  Clock,
  ArrowRight,
  Plus,
  Hash,
} from "lucide-react";

import { useCustomerStore } from "@/stores/useCustomerStore";
import { useCaseStore } from "@/stores/useCaseStore";
import { useRuleStore } from "@/stores/useRuleStore";
import { formatGanzhiYearMonth } from "@/lib/lunarGanzhi";
import { getDashboardCounts } from "@/lib/dashboardMetrics";

export default function Page() {
  const customers = useCustomerStore((state) => state.customers);
  const records = useCaseStore((state) => state.records);
  const rules = useRuleStore((state) => state.rules);
  const [ganzhiYearMonth, setGanzhiYearMonth] = useState<string>("");

  useEffect(() => {
    setGanzhiYearMonth(formatGanzhiYearMonth(new Date()));
  }, []);

  const recentRecords = records.slice(-5).reverse();
  const counts = getDashboardCounts({ customers, records, rules });

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-[#2F2F2F] chinese-font tracking-tight">
            工作台首页
          </h2>
          <p className="text-[#B37D56] font-medium mt-3 chinese-font opacity-80">
            欢迎回来，今日已记录{" "}
            {
              records.filter(
                (r) =>
                  new Date(r.createdAt).toDateString() ===
                  new Date().toDateString(),
              ).length
            }{" "}
            例咨询。
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#2F2F2F]/30 uppercase tracking-[0.3em] font-bold">
            农历岁次
          </p>
          <p className="text-lg font-bold text-[#2F2F2F] chinese-font">
            {ganzhiYearMonth}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          {
            title: "客户",
            subtitle: "Customers",
            val: counts.customers,
            icon: Users,
            href: "/customers",
            color: "#8DA399",
          },
          {
            title: "八字案卷",
            subtitle: "Bazi Cases",
            val: counts.baziRecords,
            icon: Hash,
            href: "/bazi",
            color: "#2F2F2F",
          },
          {
            title: "六爻卦例",
            subtitle: "I Ching Cases",
            val: counts.liuyaoRecords,
            icon: BookOpen,
            href: "/liuyao",
            color: "#A62121",
          },
          {
            title: "规则",
            subtitle: "Rules",
            val: counts.rules,
            icon: ShieldCheck,
            href: "/rules",
            color: "#B37D56",
          },
        ].map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="bg-white p-8 border border-[#B37D56]/10 relative group hover:border-[#B37D56]/30 transition-all duration-500 rounded-[4px] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A62121]/30"
          >
            <card.icon size={16} className="absolute top-8 right-8 text-[#2F2F2F]/20" />
            <p className="text-[10px] text-[#2F2F2F]/30 uppercase tracking-[0.3em] font-bold">
              {card.subtitle}
            </p>
            <p className="mt-2 text-xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
              {card.title}
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs text-[#2F2F2F]/30 font-bold tracking-[0.2em] uppercase">
                  总数
                </p>
                <p className="text-3xl font-bold text-[#2F2F2F]">{card.val}</p>
              </div>
              <ArrowRight
                size={16}
                className="text-[#2F2F2F]/10 group-hover:text-[#A62121] transform group-hover:translate-x-1 transition-all"
              />
            </div>
            <div
              className="w-6 h-[1.5px] mt-6 transition-all duration-500 group-hover:w-12"
              style={{ backgroundColor: card.color }}
            />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <section className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between border-b border-[#B37D56]/10 pb-4">
            <h3 className="text-xl font-bold text-[#2F2F2F] chinese-font flex items-center gap-3">
              <Clock size={18} className="text-[#A62121]" />
              最近咨询记录
            </h3>
            <Link
              href="/cases"
              className="text-xs text-[#B37D56] hover:text-[#A62121] font-bold tracking-widest uppercase flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-0 border-x border-t border-[#B37D56]/10 bg-white">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/cases/edit/${record.id}`}
                  className="group flex items-center justify-between p-6 hover:bg-black/[0.02] border-b border-[#B37D56]/10 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#2F2F2F] group-hover:text-[#A62121] transition-colors chinese-font">
                      {record.subject}
                    </h4>
                    <p className="text-[10px] text-[#2F2F2F]/40 uppercase tracking-widest">
                      {new Date(record.createdAt).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-[10px] px-3 py-1 border rounded-none font-bold tracking-tighter ${
                        record.module === "liuyao"
                          ? "border-[#8DA399]/30 text-[#8DA399]"
                          : "border-[#A62121]/30 text-[#A62121]"
                      }`}
                    >
                      {record.module === "liuyao" ? "六爻" : "八字"}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-[#2F2F2F]/10 group-hover:text-[#A62121] transform group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-20 text-center border-b border-[#B37D56]/10">
                <p className="text-sm text-[#2F2F2F]/20 chinese-font italic">
                  暂无咨询记录。
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-bold text-[#2F2F2F] chinese-font border-b border-[#B37D56]/10 pb-4">
            快捷操作
          </h3>

          <div className="space-y-4">
            <Link
              href="/cases/new"
              className="block p-8 bg-[#A62121] text-white relative group overflow-hidden rounded-none shadow-sm"
            >
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brush-strokes.png')] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xl font-bold chinese-font mb-1 tracking-widest">
                  新建六爻
                </p>
                <p className="text-white/60 text-[10px] chinese-font uppercase tracking-tighter">
                  I Ching Divination
                </p>
              </div>
              <Plus
                size={32}
                className="absolute right-[-5px] bottom-[-5px] text-white/10 group-hover:scale-125 transition-transform"
              />
            </Link>

            <Link
              href="/bazi?new=1"
              onClick={() => {
                // TODO: 考虑通过 state 传递默认 module
              }}
              className="block p-8 bg-[#2F2F2F] text-[#FAF7F2] relative group overflow-hidden rounded-none shadow-sm"
            >
              <div className="relative z-10">
                <p className="text-xl font-bold chinese-font mb-1 tracking-widest">
                  新建八字
                </p>
                <p className="text-[#FAF7F2]/40 text-[10px] chinese-font uppercase tracking-tighter">
                  Bazi / Four Pillars
                </p>
              </div>
              <Hash
                size={32}
                className="absolute right-[-5px] bottom-[-5px] text-[#FAF7F2]/10 group-hover:scale-125 transition-transform"
              />
            </Link>

            <Link
              href="/customers/new"
              className="block p-8 bg-white border border-[#B37D56]/20 group hover:border-[#A62121] transition-all rounded-none"
            >
              <p className="text-xl font-bold text-[#2F2F2F] group-hover:text-[#A62121] transition-colors chinese-font mb-1 tracking-widest">
                添加客户
              </p>
              <p className="text-[#2F2F2F]/40 text-[10px] chinese-font">
                Register New Customer
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
