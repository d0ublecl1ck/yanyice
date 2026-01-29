"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, History, FileText, Star, ExternalLink } from "lucide-react";

import { useCustomerStore } from "@/stores/useCustomerStore";
import { useCaseStore } from "@/stores/useCaseStore";

function CustomerHistoryPage({ id }: { id: string }) {
  const customers = useCustomerStore((state) => state.customers);
  const events = useCustomerStore((state) => state.events);
  const records = useCaseStore((state) => state.records);

  useEffect(() => {
    void useCustomerStore.getState().bootstrap();
    void useCustomerStore.getState().loadCustomerEvents(id);
  }, [id]);

  const customer = customers.find((c) => c.id === id);

  const combinedTimeline = useMemo(() => {
    const customerEvents = events
      .filter((e) => e.customerId === id)
      .map((e) => ({
        id: e.id,
        type: "event" as const,
        dateDisplay: e.time,
        timestamp: 0,
        title: e.description,
        content: "",
        tags: e.tags,
      }));

    const customerRecords = records
      .filter((r) => r.customerId === id)
      .map((r) => ({
        id: r.id,
        type: "consultation" as const,
        dateDisplay: new Date(r.createdAt).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        timestamp: r.createdAt,
        title: r.subject,
        content: r.notes,
        module: r.module,
      }));

    return [...customerEvents, ...customerRecords].sort((a, b) => {
      if (a.type === "consultation" && b.type === "consultation") return b.timestamp - a.timestamp;
      if (a.type === "event" && b.type === "event") return a.dateDisplay.localeCompare(b.dateDisplay);
      return a.type === "event" ? -1 : 1;
    });
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
    <div className="space-y-12 pb-20">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-8">
        <div className="space-y-4">
          <Link
            href={`/customers/edit/${id}`}
            className="flex items-center gap-1 text-[10px] text-[#B37D56] font-bold uppercase tracking-widest hover:text-[#A62121] transition-colors"
          >
            <ChevronLeft size={12} /> 返回资料编辑
          </Link>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
              {customer.name} · 历程纪
            </h2>
            <span className="text-[10px] px-2 py-0.5 border border-[#B37D56]/30 text-[#B37D56] font-bold uppercase tracking-tighter">
              {customer.gender === "male" ? "乾造" : "坤造"}
            </span>
          </div>
          <p className="text-xs text-[#2F2F2F]/40 chinese-font tracking-widest leading-loose">
            纵观岁月起伏，记录因果流转。此卷详细记载了客户的人身大事与历次咨询推演。
          </p>
        </div>
        <div className="hidden md:block text-right">
          <div className="p-4 bg-white border border-[#B37D56]/10 inline-block">
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">在册时长</p>
            <p className="text-lg font-bold text-[#2F2F2F] chinese-font">
              已随行 {Math.floor((Date.now() - customer.createdAt) / (1000 * 60 * 60 * 24))} 日
            </p>
          </div>
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto pl-8 md:pl-0">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[0.5px] bg-[#B37D56]/20 transform md:-translate-x-1/2" />

        <div className="space-y-16">
          {combinedTimeline.length > 0 ? (
            combinedTimeline.map((item, index) => (
              <div
                key={item.id}
                className={`relative flex flex-col md:flex-row items-start md:items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div
                  className={`w-full md:w-[45%] ${
                    index % 2 === 0 ? "md:pr-12 text-left md:text-right" : "md:pl-12 text-left"
                  }`}
                >
                  <div className="bg-white p-6 border border-[#B37D56]/10 hover:border-[#A62121]/30 transition-all shadow-sm group">
                    <div
                      className={`flex items-center gap-2 mb-2 ${
                        index % 2 === 0 ? "md:justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#A62121] tracking-[0.2em] uppercase">
                        {item.dateDisplay}
                      </span>
                      {item.type === "consultation" && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#8DA399]/5 text-[#8DA399] border border-[#8DA399]/10 font-bold uppercase">
                          {item.module === "liuyao" ? "六爻" : "八字"}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-[#2F2F2F] chinese-font mb-2 group-hover:text-[#A62121] transition-colors">
                      {item.title}
                    </h4>
                    {item.content && (
                      <p className="text-xs text-[#2F2F2F]/50 chinese-font line-clamp-2 italic leading-loose">
                        {item.content}
                      </p>
                    )}
                    {item.type === "consultation" && (
                      <Link
                        href={`/cases/edit/${item.id}`}
                        className={`mt-4 inline-flex items-center gap-1 text-[9px] font-bold text-[#B37D56] hover:text-[#A62121] uppercase tracking-widest transition-colors ${
                          index % 2 === 0 ? "md:flex-row-reverse" : ""
                        }`}
                      >
                        查看详情 <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="absolute left-4 md:left-1/2 top-1.5 md:top-auto w-8 h-8 -ml-4 rounded-full bg-[#FAF7F2] border border-[#B37D56]/20 flex items-center justify-center z-10 shadow-sm">
                  {item.type === "event" ? (
                    <Star size={14} className="text-[#A62121]" fill="#A62121" />
                  ) : (
                    <FileText size={14} className="text-[#B37D56]" />
                  )}
                </div>

                <div className={`hidden md:block w-[45%] ${index % 2 === 0 ? "pl-12 text-left" : "pr-12 text-right"}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#2F2F2F]/20 uppercase tracking-[0.4em]">
                      {item.type === "event" ? "人生大事" : "咨询卷宗"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <History size={48} className="mx-auto text-[#B37D56]/10 mb-4" />
              <p className="text-xs text-[#2F2F2F]/20 chinese-font italic">尚无历史足迹记录</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto pt-10 border-t border-[#B37D56]/5">
        <div className="bg-[#A62121]/5 p-8 border border-[#A62121]/10 text-center space-y-4">
          <h5 className="text-sm font-bold text-[#A62121] chinese-font tracking-widest">撰写新的经历</h5>
          <p className="text-[10px] text-[#2F2F2F]/60 leading-loose">
            无论是命中的关键转折，还是日常的卜筮解惑，<br />
            每一笔记录都是对他/她人生轨迹的深度还原。
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/cases/new"
              className="px-6 py-2 bg-[#2F2F2F] text-white text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-black transition-all"
            >
              起卦录入
            </Link>
            <Link
              href={`/customers/edit/${id}`}
              className="px-6 py-2 border border-[#B37D56]/20 text-[#2F2F2F] text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-[#FAF7F2] transition-all"
            >
              记录大事
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerHistoryPage;
