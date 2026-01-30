"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Info, User, LogOut, Sparkles, ScrollText, RotateCcw } from "lucide-react";

import { Select, type SelectOption } from "@/components/Select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { useAiConfigStore } from "@/stores/useAiConfigStore";
import { useQuoteStore } from "@/stores/useQuoteStore";
import {
  getDefaultAiConfig,
  sanitizeAiApiKey,
  sanitizeAiModel,
  sanitizeAiVendor,
} from "@/lib/aiConfig";
import { AI_VENDORS, getAiVendorById } from "@/lib/aiVendors";

export default function Page() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const toast = useToastStore((s) => s.show);

  const aiVendor = useAiConfigStore((s) => s.vendor);
  const aiModel = useAiConfigStore((s) => s.model);
  const aiHasApiKey = useAiConfigStore((s) => s.hasApiKey);
  const aiStatus = useAiConfigStore((s) => s.status);
  const bootstrapAi = useAiConfigStore((s) => s.bootstrap);
  const updateModel = useAiConfigStore((s) => s.updateModel);
  const saveApiKey = useAiConfigStore((s) => s.saveApiKey);
  const clearApiKey = useAiConfigStore((s) => s.clearApiKey);

  const quotes = useQuoteStore((s) => s.quotes);
  const quoteStatus = useQuoteStore((s) => s.status);
  const bootstrapQuotes = useQuoteStore((s) => s.bootstrap);
  const saveQuoteLines = useQuoteStore((s) => s.saveQuoteLines);
  const resetSystemQuotes = useQuoteStore((s) => s.resetSystemQuotes);

  const defaultAiConfig = useMemo(() => getDefaultAiConfig(), []);

  const [vendorDraft, setVendorDraft] = useState(aiVendor);
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [quoteLinesDraft, setQuoteLinesDraft] = useState("");
  const [hasEditedQuoteLines, setHasEditedQuoteLines] = useState(false);
  const lastServerRef = useRef<{ vendor: string; model: string } | null>(null);

  useEffect(() => {
    void bootstrapAi().catch(() => {
      toast("加载 AI 配置失败，请稍后重试", "warning");
    });
  }, [bootstrapAi, toast]);

  useEffect(() => {
    void bootstrapQuotes().catch(() => {
      toast("加载名言失败，请稍后重试", "warning");
    });
  }, [bootstrapQuotes, toast]);

  useEffect(() => {
    if (quoteStatus !== "ready") return;
    if (hasEditedQuoteLines) return;
    const enabledLines = quotes.filter((q) => q.enabled).map((q) => q.text).join("\n");
    setQuoteLinesDraft(enabledLines);
  }, [hasEditedQuoteLines, quoteStatus, quotes]);

  useEffect(() => {
    const last = lastServerRef.current;
    if (last && last.vendor === aiVendor && last.model === aiModel) return;
    lastServerRef.current = { vendor: aiVendor, model: aiModel };
    setVendorDraft(aiVendor);
    setModelDraft(aiModel);
  }, [aiVendor, aiModel]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleResetAiConfig = () => {
    setVendorDraft(defaultAiConfig.vendor);
    setModelDraft(defaultAiConfig.model);
    setApiKeyDraft("");
    void updateModel(defaultAiConfig.model).then(
      () => toast("已恢复默认模型配置", "info"),
      () => toast("恢复默认失败，请稍后重试", "warning"),
    );
  };

  const vendorOptions = useMemo<Array<SelectOption<string>>>(
    () => AI_VENDORS.map((v) => ({ value: v.id, label: v.label })),
    [],
  );

  const selectedVendor = useMemo(() => getAiVendorById(vendorDraft), [vendorDraft]);
  const modelPlaceholder = selectedVendor?.modelPlaceholder ?? "留空使用默认值";
  const modelHint = selectedVendor?.modelRecommendedHint ?? "留空使用默认值";
  const apiKeyHint = selectedVendor?.apiKeyHint ?? "在对应厂家控制台获取";

  const commitModel = () => {
    const next = sanitizeAiModel(modelDraft);
    if (next === null) {
      toast("模型最多 80 字", "warning");
      setModelDraft(aiModel);
      return;
    }
    if (next === aiModel) return;
    setModelDraft(next);
    void updateModel(next).then(
      () => toast("模型已更新", "success"),
      () => toast("模型更新失败，请稍后重试", "warning"),
    );
  };

  const handleSaveApiKey = () => {
    const next = sanitizeAiApiKey(apiKeyDraft);
    if (next === null) {
      toast("API Key 过长", "warning");
      return;
    }
    if (!next) {
      toast("请输入 API Key", "warning");
      return;
    }

    void saveApiKey(next).then(
      () => {
        setApiKeyDraft("");
        toast("API Key 已保存", "success");
      },
      () => toast("API Key 保存失败，请稍后重试", "warning"),
    );
  };

  const handleSaveQuoteLines = () => {
    void saveQuoteLines(quoteLinesDraft).then(
      () => {
        setHasEditedQuoteLines(false);
        toast("名言列表已保存", "success");
      },
      () => toast("保存失败，请稍后重试", "warning"),
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
          个人设置
        </h2>
        <p className="text-slate-500 mt-1 chinese-font">管理您的账号安全与 AI 配置</p>
      </header>

      <div className="max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#A62121]/5 text-[#A62121] rounded-none border border-[#A62121]/10">
                <User size={20} />
              </div>
              <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">账号信息</h3>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#A62121]/20 text-[#A62121] font-bold text-xs tracking-widest hover:bg-[#A62121] hover:text-white transition-all chinese-font rounded-[2px]"
              title="退出当前账号"
            >
              <LogOut size={14} />
              退出
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAF7F2] border border-[#B37D56]/5">
            <div>
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1">
                当前登录账号
              </p>
              <p className="font-bold text-[#2F2F2F] text-lg chinese-font">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-[#2F2F2F] text-white flex items-center justify-center font-bold text-xl chinese-font">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </section>

        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#B37D56]/10 text-[#B37D56] rounded-none border border-[#B37D56]/20">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">AI 配置</h3>
            </div>

            <button
              onClick={handleResetAiConfig}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#B37D56]/20 text-[#2F2F2F] font-bold text-xs tracking-widest hover:bg-[#FAF7F2] transition-all chinese-font rounded-[2px]"
              title="恢复默认 AI 配置"
            >
              恢复默认
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-none border border-[#B37D56]/5">
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1">
                提示
              </p>
              <p className="text-xs text-[#2F2F2F]/60 chinese-font">
                当前仅支持智谱 BigModel。这里用于配置「厂家」与「模型」的默认值，为后期接入 AI 对话做准备。
                配置保存到服务端账户下，API Key 不会在前端回显。
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                提供商
              </span>
              <Select
                value={vendorDraft}
                options={vendorOptions}
                variant="box"
                disabled
                onValueChange={(next) => {
                  const nextVendor = sanitizeAiVendor(String(next));
                  if (!nextVendor) {
                    toast("厂家不能为空，且最多 48 字", "warning");
                    return;
                  }
                  setVendorDraft(nextVendor);
                  setModelDraft("");
                }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                模型
              </span>
              <input
                value={modelDraft}
                onChange={(e) => setModelDraft(e.target.value)}
                onBlur={commitModel}
                placeholder={modelPlaceholder}
                className="w-full px-3 py-2 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50"
                autoComplete="off"
                disabled={aiStatus === "loading"}
              />
              <p className="text-[10px] text-[#2F2F2F]/40">{modelHint}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                API Key
              </span>
              <div className="flex gap-2 items-center">
                <input
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder={aiHasApiKey ? "已配置（重新粘贴可覆盖）" : "********"}
                  type="password"
                  className="w-full px-3 py-2 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50"
                  autoComplete="off"
                  disabled={aiStatus === "loading"}
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-3 py-2 bg-[#A62121] text-white text-xs font-bold tracking-widest hover:bg-[#8B1A1A] transition-colors rounded-[2px] chinese-font"
                  disabled={aiStatus === "loading"}
                >
                  保存
                </button>
                <button
                  onClick={() => setIsClearOpen(true)}
                  className="px-3 py-2 bg-white border border-[#A62121]/20 text-[#A62121] text-xs font-bold tracking-widest hover:bg-[#A62121] hover:text-white transition-all rounded-[2px] chinese-font"
                  disabled={!aiHasApiKey || aiStatus === "loading"}
                >
                  清除
                </button>
              </div>
              <p className="text-[10px] text-[#2F2F2F]/40">{apiKeyHint}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">当前生效</p>
                <p className="text-xs text-[#2F2F2F]/40">
                  厂家：{aiVendor}；模型：{aiModel || "（默认）"}；API Key：{aiHasApiKey ? "已配置" : "未配置"}
                </p>
              </div>
              <div className="text-[10px] text-[#2F2F2F]/40 uppercase tracking-widest">自动保存</div>
            </div>
          </div>
        </section>

        <ConfirmDialog
          open={isClearOpen}
          title="清除 API Key？"
          description="清除后将无法调用对应厂家接口，后续可重新粘贴保存。"
          confirmText="清除"
          onCancel={() => setIsClearOpen(false)}
          onConfirm={() => {
            setIsClearOpen(false);
            void clearApiKey().then(
              () => toast("API Key 已清除", "info"),
              () => toast("清除失败，请稍后重试", "warning"),
            );
          }}
        />

        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2F2F2F]/5 text-[#2F2F2F] rounded-none border border-[#2F2F2F]/10">
                <ScrollText size={20} />
              </div>
              <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">名言列表</h3>
            </div>

            <button
              onClick={() => {
                void resetSystemQuotes().then(
                  () => {
                    setHasEditedQuoteLines(false);
                    toast("系统名言已恢复", "info");
                  },
                  () => toast("恢复失败，请稍后重试", "warning"),
                );
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#B37D56]/20 text-[#2F2F2F] font-bold text-xs tracking-widest hover:bg-[#FAF7F2] transition-all chinese-font rounded-[2px]"
              title="恢复系统内置名言"
              disabled={quoteStatus === "loading"}
            >
              <RotateCcw size={14} />
              恢复系统名言
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-none border border-[#B37D56]/5">
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1">
                提示
              </p>
              <p className="text-xs text-[#2F2F2F]/60 chinese-font">
                每行一条名言；点击保存后会启用这些名言，未包含的名言会被自动禁用。首页只展示一条。
              </p>
            </div>

            <textarea
              value={quoteLinesDraft}
              onChange={(e) => {
                setHasEditedQuoteLines(true);
                setQuoteLinesDraft(e.target.value);
              }}
              placeholder="每行输入一条名言…"
              rows={10}
              className="w-full px-3 py-2 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50 resize-y"
              disabled={quoteStatus === "loading"}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-[#2F2F2F]/40">
                {quoteStatus === "loading" ? "正在加载…" : "支持重复行自动去重；空行会被忽略"}
              </p>
              <button
                onClick={handleSaveQuoteLines}
                className="px-3 py-2 bg-[#2F2F2F] text-white text-xs font-bold tracking-widest hover:bg-black transition-colors rounded-[2px] chinese-font"
                disabled={quoteStatus === "loading"}
              >
                保存
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="p-2 bg-[#8DA399]/10 text-[#8DA399] rounded-none border border-[#8DA399]/20">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">隐私与安全</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-none border border-[#B37D56]/5 flex items-start gap-3 mb-4">
              <Info className="text-indigo-600 shrink-0" size={18} />
              <div className="text-xs text-[#2F2F2F]/60">
                <p className="font-bold mb-1 text-[#2F2F2F]">AI 助手状态</p>
                <p>当前 AI 助手已通过全局环境配置。图片识别与文本提取功能已就绪。</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">云同步加密 (开发中)</p>
                <p className="text-xs text-[#2F2F2F]/40">所有命例数据将通过您的主密码进行端到端加密。</p>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-none relative cursor-not-allowed opacity-50">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white shadow-sm"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">发送 AI 确认</p>
                <p className="text-xs text-[#2F2F2F]/40">在将文本/图片发送给 Google 之前始终弹出确认提示。</p>
              </div>
              <div className="w-12 h-6 bg-[#A62121]/60 rounded-none relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white shadow-sm"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 lg:col-span-2">
          <p className="text-center text-[10px] text-[#2F2F2F]/20 mt-4 uppercase tracking-[0.2em]">
            Yan Yi Ce - Professional Astrology Workspace
          </p>
        </section>
      </div>
    </div>
  );
}
