"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Plus, Shield, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

import type { ModuleType } from "@/lib/types";
import { rulesHref } from "@/lib/caseLinks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { useRuleStore } from "@/stores/useRuleStore";
import { useToastStore } from "@/stores/useToastStore";

const moduleLabel: Record<ModuleType, string> = {
  liuyao: "六爻",
  bazi: "八字",
};

export default function RulesPageClient({ module }: { module: ModuleType }) {
  const rules = useRuleStore((s) => s.rules);
  const status = useRuleStore((s) => s.status);
  const seedRules = useRuleStore((s) => s.seedRules);
  const addRule = useRuleStore((s) => s.addRule);
  const updateRule = useRuleStore((s) => s.updateRule);
  const deleteRule = useRuleStore((s) => s.deleteRule);
  const showToast = useToastStore((s) => s.show);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newMsg, setNewMsg] = useState("");

  const filteredRules = useMemo(() => rules.filter((r) => r.module === module), [rules, module]);

  const handleAdd = async () => {
    if (isSaving) return;
    if (!newName.trim()) {
      showToast("请填写规则名称", "warning");
      return;
    }
    if (!newMsg.trim()) {
      showToast("请填写断诀内容", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await addRule({
        module,
        name: newName,
        enabled: true,
        condition: "自定义条件",
        message: newMsg,
      });
      setNewName("");
      setNewMsg("");
      setIsAdding(false);
      showToast("规则已保存", "success");
    } catch {
      showToast("保存失败，请稍后重试", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            断诀规则系统（{moduleLabel[module]}）
          </h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">
            Deduction Rules Library
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSeedConfirmOpen(true)}
            className="px-6 py-2 text-xs font-bold tracking-widest border border-[#B37D56]/20 text-[#2F2F2F]/60 hover:text-[#2F2F2F] hover:bg-[#FAF7F2] transition-all rounded-[2px]"
          >
            生成预置规则
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
          >
            <Plus size={16} />
            新建规则
          </button>
        </div>
      </header>

      <div className="flex items-center gap-4">
        {(["liuyao", "bazi"] as const).map((m) => (
          <Link
            key={m}
            href={rulesHref(m)}
            className={`px-6 py-2 text-xs font-bold tracking-widest uppercase border transition-all flex items-center gap-2 ${
              module === m
                ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                : "bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]"
            }`}
          >
            <Layers size={14} />
            {m === "liuyao" ? "六爻" : "八字"}
          </Link>
        ))}
      </div>

      <Modal
        open={isAdding}
        title={`新建规则（${moduleLabel[module]}）`}
        onClose={() => setIsAdding(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-xs font-bold tracking-widest border border-[#B37D56]/20 text-[#2F2F2F]/60 hover:text-[#2F2F2F] hover:bg-[#FAF7F2] transition-all rounded-[2px]"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={isSaving}
              className="px-6 py-2 text-xs font-bold tracking-widest bg-[#A62121] text-white hover:bg-[#8B1A1A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-[2px]"
            >
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#A62121]/10 text-[#A62121] flex items-center justify-center rounded-[4px]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-xs text-[#B37D56] font-bold uppercase tracking-widest">新规则</p>
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
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="如：注意应期..."
                rows={4}
                className="w-full bg-transparent border border-[#2F2F2F]/10 rounded-[4px] px-3 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold resize-y"
              />
            </div>
          </div>
        </div>
      </Modal>

      <div className="bg-white border border-[#B37D56]/10">
        {filteredRules.length > 0 ? (
          <div className="divide-y divide-[#B37D56]/5">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <p className="font-bold text-[#2F2F2F] chinese-font truncate max-w-[10rem]">
                    {rule.name}
                  </p>
                  <p className="text-[10px] text-[#2F2F2F]/40 truncate max-w-[12rem] hidden md:block">
                    {rule.condition}
                  </p>
                  <p
                    className="text-xs text-[#B37D56] chinese-font italic truncate min-w-0"
                    title={rule.message}
                  >
                    {rule.message}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (togglingId) return;
                      setTogglingId(rule.id);
                      try {
                        await updateRule(rule.id, { enabled: !rule.enabled });
                      } catch {
                        showToast("更新失败，请稍后重试", "error");
                      } finally {
                        setTogglingId(null);
                      }
                    }}
                    disabled={togglingId === rule.id}
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                      rule.enabled ? "text-[#8DA399]" : "text-[#2F2F2F]/30"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    title={rule.enabled ? "启用" : "停用"}
                  >
                    {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    <span className="hidden lg:inline">{rule.enabled ? "启用" : "停用"}</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (deletingId) return;
                      setDeletingId(rule.id);
                      try {
                        await deleteRule(rule.id);
                        showToast("规则已删除", "info");
                      } catch {
                        showToast("删除失败，请稍后重试", "error");
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === rule.id}
                    className="text-[#A62121]/50 hover:text-[#A62121] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title="删除规则"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[#2F2F2F]/20 chinese-font italic">
              {status === "loading" ? "正在加载规则..." : "当前模块暂无规则"}
            </p>
            {status !== "loading" ? (
              <div className="mt-6">
                <button
                  onClick={() => setSeedConfirmOpen(true)}
                  className="px-6 py-2 text-xs font-bold tracking-widest bg-[#2F2F2F] text-white hover:bg-[#1F1F1F] transition-colors rounded-[2px]"
                >
                  生成预置规则
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={seedConfirmOpen}
        title={`生成预置规则（${moduleLabel[module]}）`}
        description="将自动生成一组预置断诀规则；可重复执行，不会重复创建。"
        confirmText={isSeeding ? "生成中..." : "生成"}
        onCancel={() => {
          if (isSeeding) return;
          setSeedConfirmOpen(false);
        }}
        onConfirm={async () => {
          if (isSeeding) return;
          setIsSeeding(true);
          try {
            const createdCount = await seedRules({ module });
            setSeedConfirmOpen(false);
            showToast(createdCount > 0 ? `已生成 ${createdCount} 条预置规则` : "预置规则已存在", "success");
          } catch {
            showToast("生成失败，请稍后重试", "error");
          } finally {
            setIsSeeding(false);
          }
        }}
      />
    </div>
  );
}
