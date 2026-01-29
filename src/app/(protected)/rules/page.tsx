"use client";

import React, { useState } from "react";
import { Plus, Shield, ToggleLeft, ToggleRight, Trash2, Layers } from "lucide-react";

import { useRuleStore } from "@/stores/useRuleStore";
import { ModuleType } from "@/lib/types";

export default function Page() {
  const { rules, addRule, updateRule, deleteRule } = useRuleStore();
  const [activeTab, setActiveTab] = useState<ModuleType>("liuyao");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMsg, setNewMsg] = useState("");

  const filteredRules = rules.filter((r) => r.module === activeTab);

  const handleAdd = () => {
    if (!newName || !newMsg) return;
    addRule({
      module: activeTab,
      name: newName,
      enabled: true,
      condition: "自定义条件",
      message: newMsg,
    });
    setNewName("");
    setNewMsg("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            断诀规则系统
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Deduction Rules Library
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
        >
          <Plus size={16} />
          新建规则
        </button>
      </header>

      <div className="flex items-center gap-4">
        {(["liuyao", "bazi"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setActiveTab(m)}
            className={`px-6 py-2 text-xs font-bold tracking-widest uppercase border transition-all flex items-center gap-2 ${
              activeTab === m
                ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                : "bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]"
            }`}
          >
            <Layers size={14} />
            {m === "liuyao" ? "六爻" : "八字"}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="bg-white border border-[#B37D56]/10 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#A62121]/10 text-[#A62121] flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-xs text-[#B37D56] font-bold uppercase tracking-widest">
                新规则
              </p>
              <p className="text-lg font-bold chinese-font">为当前模块添加断诀</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                规则名称
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="如：动爻克用神"
                className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                断诀内容
              </label>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="如：注意应期..."
                className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-xs font-bold tracking-widest border border-[#B37D56]/20 text-[#2F2F2F]/60 hover:text-[#2F2F2F] hover:bg-[#FAF7F2] transition-all"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2 text-xs font-bold tracking-widest bg-[#A62121] text-white hover:bg-[#8B1A1A] transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#B37D56]/10">
        {filteredRules.length > 0 ? (
          <div className="divide-y divide-[#B37D56]/5">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="p-6 flex items-start justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#2F2F2F] chinese-font">{rule.name}</p>
                    <button
                      onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                        rule.enabled ? "text-[#8DA399]" : "text-[#2F2F2F]/30"
                      }`}
                    >
                      {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {rule.enabled ? "启用" : "停用"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#2F2F2F]/40">{rule.condition}</p>
                  <p className="text-xs text-[#B37D56] chinese-font leading-relaxed italic">
                    {rule.message}
                  </p>
                </div>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-[#A62121]/50 hover:text-[#A62121] transition-colors"
                  title="删除规则"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[#2F2F2F]/20 chinese-font italic">当前模块暂无规则</p>
          </div>
        )}
      </div>
    </div>
  );
}
