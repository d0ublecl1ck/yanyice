"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  Clock,
  ExternalLink,
  Hash,
  History,
  Layers,
  MapPin,
  Plus,
  Settings,
  User,
} from "lucide-react";

import { buildCustomerTimeline } from "@/lib/customerTimeline";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";

function CustomerViewPage({ id }: { id: string }) {
  const router = useRouter();
  const customers = useCustomerStore((state) => state.customers);
  const events = useCustomerStore((state) => state.events);
  const records = useCaseStore((state) => state.records);

  const customer = customers.find((c) => c.id === id);
  const customerRecords = records.filter((r) => r.customerId === id);

  const fullTimeline = useMemo(() => {
    return buildCustomerTimeline({ customerId: id, events, records });
  }, [id, events, records]);

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#2F2F2F]/40 chinese-font italic">未找到该客户资料</p>
        <Link href="/customers" className="text-[#A62121] text-sm mt-4 inline-block font-bold">
          返回名录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex justify-between items-center border-b border-[#B37D56]/10 pb-6">
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-2 text-[#B37D56] hover:text-[#A62121] transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          返回名录
        </button>
        <div className="flex gap-4">
          <Link
            href={`/customers/edit/${id}`}
            className="px-5 py-2 border border-[#B37D56]/20 text-[#B37D56] text-xs font-bold tracking-widest hover:bg-[#FAF7F2] transition-all rounded-[2px] flex items-center gap-2"
          >
            <Settings size={14} />
            编辑资料
          </Link>
          <Link
            href={`/bazi/new?customerId=${encodeURIComponent(id)}`}
            className="px-5 py-2 bg-[#2F2F2F] text-white text-xs font-bold tracking-widest hover:bg-black transition-all rounded-[2px] flex items-center gap-2"
          >
            <Plus size={14} />
            新建排盘
          </Link>
        </div>
      </header>

      <div className="bg-white p-10 border border-[#B37D56]/20 rounded-[4px] relative overflow-hidden shadow-none">
        <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-[#B37D56]/10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-[#B37D56]/10 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-12">
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-24 h-24 bg-[#FAF7F2] border border-[#B37D56]/20 flex items-center justify-center mb-4 rounded-[4px]">
              <User size={40} className="text-[#B37D56]/40" />
            </div>
            <h3 className="text-3xl font-bold text-[#2F2F2F] chinese-font">{customer.name}</h3>
            <span className="text-xs font-bold text-[#B37D56] mt-1 tracking-[0.2em]">
              {customer.gender === "male" ? "乾造" : customer.gender === "female" ? "坤造" : "不详"}
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-[#B37D56]/40" />
                <div className="text-xs">
                  <p className="text-[#B37D56] font-bold uppercase tracking-widest text-[9px]">
                    公历出生日期
                  </p>
                  <p className="text-[#2F2F2F] font-bold chinese-font mt-0.5">
                    {customer.birthDate || "未录入"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-[#B37D56]/40" />
                <div className="text-xs">
                  <p className="text-[#B37D56] font-bold uppercase tracking-widest text-[9px]">
                    出生时间 (时辰)
                  </p>
                  <p className="text-[#2F2F2F] font-bold chinese-font mt-0.5">
                    {customer.birthTime || "不详"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-[#B37D56]/40" />
                <div className="text-xs">
                  <p className="text-[#B37D56] font-bold uppercase tracking-widest text-[9px]">出生地点</p>
                  <p className="text-[#2F2F2F] font-bold chinese-font mt-0.5">未录入</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customer.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 border border-[#B37D56]/10 text-[#B37D56] text-[9px] bg-[#FAF7F2] font-bold rounded-[1px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-[#FAF7F2] border border-[#B37D56]/10 p-6 rounded-[4px] space-y-6">
            <h4 className="text-[10px] font-bold text-[#B37D56] uppercase tracking-[0.4em] border-b border-[#B37D56]/10 pb-2">
              关联案卷 ({customerRecords.length})
            </h4>
            <div className="space-y-4">
              {customerRecords.length > 0 ? (
                customerRecords.map((r) => (
                  <Link key={r.id} href={`/cases/edit/${r.id}`} className="block group">
                    <div className="flex items-center gap-4 bg-white p-4 border border-[#B37D56]/10 group-hover:border-[#A62121] transition-all rounded-[2px]">
                      <div
                        className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-[1px] ${
                          r.module === "bazi" ? "bg-black text-white" : "bg-[#A62121] text-white"
                        }`}
                      >
                        {r.module === "bazi" ? <Hash size={18} /> : <Layers size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2F2F2F] chinese-font truncate group-hover:text-[#A62121] transition-colors">
                          {r.subject}
                        </p>
                        <p className="text-[9px] text-[#2F2F2F]/30 uppercase tracking-tighter mt-1">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-[10px] text-[#2F2F2F]/20 italic py-4 text-center">
                  暂无关联排盘记录
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-8 relative">
            <h4 className="text-[10px] font-bold text-[#2F2F2F] uppercase tracking-[0.4em] border-b border-[#B37D56]/10 pb-2">
              全景历程全景轴 (大事与咨询)
            </h4>

            <div className="relative pl-10 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-0 before:w-[0.5px] before:h-full before:bg-[#B37D56]/20">
              {fullTimeline.length > 0 ? (
                fullTimeline.map((item) => (
                  <div key={`${item.kind}-${item.id}`} className="relative group">
                    <div
                      className={`absolute left-[-24px] top-1 w-2.5 h-2.5 rounded-[1px] border-2 border-[#FAF7F2] z-10 transition-transform group-hover:scale-150 ${
                        item.kind === "life-event" ? "bg-[#A62121]" : "bg-[#B37D56]"
                      }`}
                    />
                    <div className="bg-white border border-[#B37D56]/10 p-5 rounded-[4px] group-hover:border-[#B37D56]/30 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#A62121] uppercase tracking-[0.2em]">
                          {item.timeLabel}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 border font-bold uppercase rounded-[1px] ${
                            item.kind === "life-event"
                              ? "border-[#A62121]/20 text-[#A62121]"
                              : "border-[#B37D56]/20 text-[#B37D56]"
                          }`}
                        >
                          {item.kind === "life-event" ? "大事记" : "咨询记录"}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-[#2F2F2F] chinese-font mb-2">
                        {item.kind === "life-event" ? item.description : item.subject}
                      </h5>
                      {item.kind === "consultation" && item.notes ? (
                        <p className="text-[11px] text-[#2F2F2F]/50 leading-loose italic line-clamp-2">
                          “{item.notes}”
                        </p>
                      ) : null}
                      {item.kind === "consultation" ? (
                        <Link
                          href={`/cases/edit/${item.id}`}
                          className="mt-4 flex items-center gap-1 text-[9px] font-bold text-[#B37D56] hover:text-[#A62121] transition-colors uppercase tracking-widest"
                        >
                          查看详情 <ExternalLink size={10} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <History size={40} className="mx-auto text-[#B37D56]/10 mb-4" />
                  <p className="text-xs text-[#2F2F2F]/20 italic chinese-font">尚无历程足迹</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return <CustomerViewPage id={params.id} />;
}
