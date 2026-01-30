"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Info, User, LogOut, Sparkles } from "lucide-react";

import { Select, type SelectOption } from "@/components/Select";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { useAiConfigStore } from "@/stores/useAiConfigStore";
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
  const aiApiKey = useAiConfigStore((s) => s.apiKey);
  const aiHasHydrated = useAiConfigStore((s) => s.hasHydrated);
  const setAiVendor = useAiConfigStore((s) => s.setVendor);
  const setAiModel = useAiConfigStore((s) => s.setModel);
  const setAiApiKey = useAiConfigStore((s) => s.setApiKey);
  const resetAiConfig = useAiConfigStore((s) => s.reset);

  const defaultAiConfig = useMemo(() => getDefaultAiConfig(), []);

  const [vendorDraft, setVendorDraft] = useState(aiVendor);
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [apiKeyDraft, setApiKeyDraft] = useState(aiApiKey);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!aiHasHydrated) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    setVendorDraft(aiVendor);
    setModelDraft(aiModel);
    setApiKeyDraft(aiApiKey);
  }, [aiHasHydrated, aiVendor, aiModel, aiApiKey]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleResetAiConfig = () => {
    resetAiConfig();
    setVendorDraft(defaultAiConfig.vendor);
    setModelDraft(defaultAiConfig.model);
    setApiKeyDraft(defaultAiConfig.apiKey);
    toast("已恢复默认 AI 配置", "info");
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
    setModelDraft(next);
    setAiModel(next);
    toast("模型已更新", "success");
  };

  const commitApiKey = () => {
    const next = sanitizeAiApiKey(apiKeyDraft);
    if (next === null) {
      toast("API Key 过长", "warning");
      setApiKeyDraft(aiApiKey);
      return;
    }
    setApiKeyDraft(next);
    setAiApiKey(next);
    toast("API Key 已更新", "success");
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
                这里用于配置「厂家」与「模型」的默认值，为后期接入 AI 对话与多厂家适配做准备。
                当前仅会影响 Gemini 路由的模型选择。
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
                onValueChange={(next) => {
                  const nextVendor = sanitizeAiVendor(String(next));
                  if (!nextVendor) {
                    toast("厂家不能为空，且最多 48 字", "warning");
                    return;
                  }
                  setVendorDraft(nextVendor);
                  setAiVendor(nextVendor);
                  setModelDraft("");
                  setAiModel("");
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
              />
              <p className="text-[10px] text-[#2F2F2F]/40">{modelHint}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                API Key
              </span>
              <input
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                onBlur={commitApiKey}
                placeholder="********"
                type="password"
                className="w-full px-3 py-2 bg-white border border-[#B37D56]/20 text-sm chinese-font rounded-none focus:outline-none focus:border-[#B37D56]/50"
                autoComplete="off"
              />
              <p className="text-[10px] text-[#2F2F2F]/40">{apiKeyHint}（当前暂未用于请求）</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">当前生效</p>
                <p className="text-xs text-[#2F2F2F]/40">
                  厂家：{aiVendor}；模型：{aiModel || "（默认）"}；API Key：{aiApiKey ? "已配置" : "未配置"}
                </p>
              </div>
              <div className="text-[10px] text-[#2F2F2F]/40 uppercase tracking-widest">自动保存</div>
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
