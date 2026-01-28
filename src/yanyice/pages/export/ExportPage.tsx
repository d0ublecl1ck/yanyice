"use client";

import React from 'react';
import { Download, ShieldCheck, Database, FileArchive } from 'lucide-react';
import { useCustomerStore } from '../../stores/useCustomerStore';
import { useCaseStore } from '../../stores/useCaseStore';
import { useRuleStore } from '../../stores/useRuleStore';
import { useToastStore } from '../../stores/useToastStore';

export const ExportPage: React.FC = () => {
  const customerCount = useCustomerStore(state => state.customers.length);
  const recordCount = useCaseStore(state => state.records.length);
  const ruleCount = useRuleStore(state => state.rules.length);
  const toast = useToastStore();

  const handleExport = () => {
    toast.show('正在打包数据并生成加密 ZIP 压缩包...', 'info');
    // TODO: 实现真正的持久化数据导出逻辑
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#A62121]/5 text-[#A62121] border border-[#A62121]/20 flex items-center justify-center mx-auto rounded-none rotate-45">
          <Database size={32} className="-rotate-45" />
        </div>
        <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest pt-4">数据备份与导出</h2>
        <p className="text-[#B37D56] font-medium chinese-font opacity-80 italic">“慎终如始，则无败事”</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '在册客户', val: customerCount, unit: '位' },
          { label: '咨询卷宗', val: recordCount, unit: '卷' },
          { label: '断诀规则', val: ruleCount, unit: '条' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 border border-[#B37D56]/10 text-center space-y-1">
            <p className="text-[10px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-[#2F2F2F]">{stat.val} <span className="text-xs font-normal opacity-40">{stat.unit}</span></p>
          </div>
        ))}
      </div>

      <div className="bg-[#8DA399]/5 border border-[#8DA399]/20 p-10 space-y-8">
        <div className="flex items-start gap-4">
          <ShieldCheck className="text-[#8DA399] shrink-0" size={24} />
          <div className="space-y-2">
            <h3 className="font-bold text-[#2F2F2F] chinese-font">数据安全保障</h3>
            <p className="text-xs text-[#2F2F2F]/60 leading-relaxed chinese-font">
              导出包将包含所有的客户信息、咨询记录及您的个人规则库。所有数据仅存储在本地浏览器缓存中，建议您定期导出备份，以防数据丢失。
            </p>
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="w-full bg-[#A62121] text-white py-5 font-bold tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#8B1A1A] transition-all shadow-[0_12px_32px_rgba(166,33,33,0.15)] rounded-none"
        >
          <FileArchive size={20} />
          立即导出加密压缩包 (ZIP)
        </button>

        <p className="text-center text-[10px] text-[#B37D56] font-bold uppercase tracking-widest italic">
          Last Backup: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
