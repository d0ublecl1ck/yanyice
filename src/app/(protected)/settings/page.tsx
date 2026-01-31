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
import { ApiError } from "@/lib/apiClient";
import {
  sanitizeAiApiKey,
  sanitizeAiVendor,
} from "@/lib/aiConfig";
import { getAiVendorById, getAiVendors } from "@/lib/aiVendors";

function getToastErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) {
    if (/failed to fetch/i.test(err.message)) return "连接后端失败，请确认后端服务已启动";
    return err.message || "操作失败，请稍后重试";
  }
  return "操作失败，请稍后重试";
}

function normalizeQuoteLines(lines: string): string {
  return lines
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export default function Page() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const toast = useToastStore((s) => s.show);

  const aiVendor = useAiConfigStore((s) => s.vendor);
  const aiModel = useAiConfigStore((s) => s.model);
  const aiHasApiKey = useAiConfigStore((s) => s.hasApiKey);
  const aiStatus = useAiConfigStore((s) => s.status);
  const bootstrapAi = useAiConfigStore((s) => s.bootstrap);
  const updateVendor = useAiConfigStore((s) => s.updateVendor);
  const updateModel = useAiConfigStore((s) => s.updateModel);
  const saveApiKey = useAiConfigStore((s) => s.saveApiKey);
  const clearApiKey = useAiConfigStore((s) => s.clearApiKey);

  const quotes = useQuoteStore((s) => s.quotes);
  const quoteStatus = useQuoteStore((s) => s.status);
  const bootstrapQuotes = useQuoteStore((s) => s.bootstrap);
  const saveQuoteLines = useQuoteStore((s) => s.saveQuoteLines);
  const resetSystemQuotes = useQuoteStore((s) => s.resetSystemQuotes);
  const [vendorDraft, setVendorDraft] = useState(aiVendor);
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [quoteLinesDraft, setQuoteLinesDraft] = useState("");
  const [hasEditedQuoteLines, setHasEditedQuoteLines] = useState(false);
  const [isResetQuotesOpen, setIsResetQuotesOpen] = useState(false);
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

  const vendorOptions = useMemo<Array<SelectOption<string>>>(
    () => getAiVendors().map((v) => ({ value: v.id, label: v.label })),
    [],
  );

  const selectedVendor = useMemo(() => getAiVendorById(vendorDraft), [vendorDraft]);
  const apiKeyLinkLabel = selectedVendor?.apiKeyLinkLabel ?? "在对应厂家控制台获取";
  const apiKeyUrl = selectedVendor?.apiKeyUrl ?? "";

  const modelOptions = useMemo<Array<SelectOption<string>>>(() => {
    const list = selectedVendor?.models ?? [];
    const base: Array<SelectOption<string>> = [
      { value: "", label: selectedVendor?.modelEmptyLabel ?? "（未设置）" },
      ...list.map((m) => ({ value: m, label: m })),
    ];
    return base;
  }, [selectedVendor]);

  const commitModel = (next: string) => {
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

  useEffect(() => {
    if (quoteStatus !== "ready") return;
    if (!hasEditedQuoteLines) return;

    const normalized = normalizeQuoteLines(quoteLinesDraft);
    const enabledLines = quotes.filter((q) => q.enabled).map((q) => q.text).join("\n");
    const enabledNormalized = normalizeQuoteLines(enabledLines);

    if (normalized === enabledNormalized) {
      setHasEditedQuoteLines(false);
      return;
    }

    if (!normalized) return;

    const t = window.setTimeout(() => {
      void saveQuoteLines(quoteLinesDraft)
        .then(() => {
          setHasEditedQuoteLines(false);
          toast("名言已自动保存", "success");
        })
        .catch((err) => {
          toast(getToastErrorMessage(err), "warning");
        });
    }, 800);

    return () => window.clearTimeout(t);
  }, [hasEditedQuoteLines, quoteLinesDraft, quoteStatus, quotes, saveQuoteLines, toast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
          个人设置
        </h2>
        <p className="text-slate-500 mt-1 chinese-font">管理您的账号安全与 AI 配置</p>
      </header>

      <div className="w-full max-w-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-8">
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
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-none border border-[#B37D56]/5">
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1">
                提示
              </p>
              <p className="text-xs text-[#2F2F2F]/60 chinese-font">
                这里用于配置「提供商」与「模型」的默认值。
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
                className="h-10 px-3 text-sm chinese-font font-bold rounded-none"
                onValueChange={(next) => {
                  const nextVendor = sanitizeAiVendor(String(next));
                  if (!nextVendor) {
                    toast("提供商不能为空，且最多 48 字", "warning");
                    return;
                  }
                  if (nextVendor === aiVendor) return;
                  setVendorDraft(nextVendor);
                  setModelDraft("");
                  void updateVendor(nextVendor).then(
                    () => toast("提供商已更新", "success"),
                    () => toast("提供商更新失败，请稍后重试", "warning"),
                  );
                }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                模型
              </span>
              <Select
                value={modelDraft}
                options={modelOptions}
                variant="box"
                className="h-10 px-3 text-sm chinese-font font-bold rounded-none"
                disabled={aiStatus === "loading"}
                onValueChange={(next) => commitModel(String(next))}
              />
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
                  className="w-full h-10 px-3 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50"
                  autoComplete="off"
                  disabled={aiStatus === "loading"}
                />
                <button
                  onClick={handleSaveApiKey}
                  className="h-10 min-w-20 px-5 bg-[#A62121] text-white text-xs font-bold tracking-[0.2em] whitespace-nowrap hover:bg-[#8B1A1A] transition-colors rounded-[2px] chinese-font shrink-0"
                  disabled={aiStatus === "loading"}
                >
                  保存
                </button>
                <button
                  onClick={() => setIsClearOpen(true)}
                  className="h-10 min-w-20 px-5 bg-white border border-[#A62121]/20 text-[#A62121] text-xs font-bold tracking-[0.2em] whitespace-nowrap hover:bg-[#A62121] hover:text-white transition-all rounded-[2px] chinese-font shrink-0"
                  disabled={!aiHasApiKey || aiStatus === "loading"}
                >
                  清除
                </button>
              </div>
              <p className="text-[10px] text-[#2F2F2F]/40">
                {apiKeyUrl ? (
                  <a
                    href={apiKeyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B37D56] hover:text-[#A62121] underline underline-offset-2"
                  >
                    {apiKeyLinkLabel}
                  </a>
                ) : (
                  apiKeyLinkLabel
                )}
              </p>
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
        </div>

        <div className="flex flex-col gap-8">
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
                setIsResetQuotesOpen(true);
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
              onBlur={() => {
                const normalized = normalizeQuoteLines(quoteLinesDraft);
                if (!normalized) toast("请至少保留一条名言", "warning");
              }}
              placeholder="每行输入一条名言…"
              rows={10}
              className="w-full px-3 py-2 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50 resize-y"
              disabled={quoteStatus === "loading"}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-[#2F2F2F]/40">
                {quoteStatus === "loading" ? "正在加载…" : "自动保存；重复行会被去重；空行会被忽略"}
              </p>
            </div>
          </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
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
                <p className="text-xs text-[#2F2F2F]/40">
                  在将文本/图片发送给第三方 AI 平台之前始终弹出确认提示。
                </p>
              </div>
              <div className="w-12 h-6 bg-[#A62121]/60 rounded-none relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white shadow-sm"></div>
              </div>
            </div>
          </div>
          </section>
        </div>
      </div>

      <section className="pt-2">
        <p className="text-center text-[10px] text-[#2F2F2F]/20 mt-4 uppercase tracking-[0.2em]">
          Yan Yi Ce - Professional Astrology Workspace
        </p>
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

      <ConfirmDialog
        open={isResetQuotesOpen}
        title="恢复系统名言？"
        description="将恢复系统内置名言内容并启用（你自定义新增的名言不会删除）。"
        confirmText="恢复"
        onCancel={() => setIsResetQuotesOpen(false)}
        onConfirm={() => {
          setIsResetQuotesOpen(false);
          void resetSystemQuotes()
            .then(() => {
              setHasEditedQuoteLines(false);
              toast("系统名言已恢复", "info");
            })
            .catch((err) => {
              toast(getToastErrorMessage(err), "warning");
            });
        }}
      />
    </div>
  );
}
