"use client";

import React from "react";
import { Download, ShieldCheck, Database, FileArchive } from "lucide-react";

import { useCustomerStore } from "@/stores/useCustomerStore";
import { useCaseStore } from "@/stores/useCaseStore";
import { useRuleStore } from "@/stores/useRuleStore";
import { useToastStore } from "@/stores/useToastStore";

export default function Page() {
  const customerCount = useCustomerStore((state) => state.customers.length);
  const recordCount = useCaseStore((state) => state.records.length);
  const ruleCount = useRuleStore((state) => state.rules.length);
  const toast = useToastStore();

  const handleExport = () => {
    toast.show("正在打包数据并生成加密 ZIP 压缩包...", "info");
    // TODO: 实现真正的持久化数据导出逻辑
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#A62121]/5 text-[#A62121] border border-[#A62121]/20 flex items-center justify-center mx-auto rounded-none rotate-45">
          <Database size={32} className="-rotate-45" />
        </div>
        <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest pt-4">
          数据备份与导出
        </h2>
        <p className="text-[#B37D56] font-medium chinese-font opacity-80 italic">
          “慎终如始，则无败事”
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "在册客户", val: customerCount, unit: "位" },
          { label: "咨询卷宗", val: recordCount, unit: "卷" },
          { label: "断诀规则", val: ruleCount, unit: "条" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 border border-[#B37D56]/10 text-center space-y-1">
            <p className="text-[10px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-[#2F2F2F]">
              {stat.val}{" "}
              <span className="text-xs font-normal opacity-40">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 border border-[#B37D56]/10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8DA399]/10 text-[#8DA399] border border-[#8DA399]/20 flex items-center justify-center rotate-45">
            <ShieldCheck size={20} className="-rotate-45" />
          </div>
          <div>
            <p className="text-xs text-[#B37D56] font-bold uppercase tracking-widest">
              安全导出
            </p>
            <p className="text-lg font-bold text-[#2F2F2F] chinese-font">
              生成加密归档包
            </p>
          </div>
        </div>

        <p className="text-xs text-[#2F2F2F]/50 leading-loose chinese-font">
          导出内容包含客户资料、咨询记录与规则系统。导出后会生成一个加密 ZIP 文件，建议离线存储并定期备份。
        </p>

        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#A62121] text-white font-bold tracking-[0.3em] hover:bg-[#8B1A1A] transition-colors chinese-font"
        >
          <Download size={18} />
          开始导出
        </button>

        <div className="pt-6 border-t border-[#B37D56]/10 text-[10px] text-[#2F2F2F]/30 uppercase tracking-widest flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileArchive size={12} />
            输出格式：ZIP
          </span>
          <span>离线备份 · 推荐</span>
        </div>
      </div>
    </div>
  );
}
