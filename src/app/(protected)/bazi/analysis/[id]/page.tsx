
"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { geminiChat, type ChatMessage } from "@/lib/geminiService";
import type { BaZiData } from "@/lib/types";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useChatStore, type Message } from "@/stores/useChatStore";
import { useToastStore } from "@/stores/useToastStore";

const ELEMENT_STYLES: Record<string, { color: string }> = {
  wood: { color: "#516E41" },
  fire: { color: "#A61B1B" },
  earth: { color: "#8E623F" },
  metal: { color: "#D4AF37" },
  water: { color: "#2B4490" },
};

const getElByStem = (stem: string): keyof typeof ELEMENT_STYLES => {
  if ("甲乙".includes(stem)) return "wood";
  if ("丙丁".includes(stem)) return "fire";
  if ("戊己".includes(stem)) return "earth";
  if ("庚辛".includes(stem)) return "metal";
  if ("壬癸".includes(stem)) return "water";
  return "earth";
};

const getElByBranch = (branch: string): keyof typeof ELEMENT_STYLES => {
  if ("寅卯".includes(branch)) return "wood";
  if ("巳午".includes(branch)) return "fire";
  if ("辰戌丑未".includes(branch)) return "earth";
  if ("申酉".includes(branch)) return "metal";
  if ("亥子".includes(branch)) return "water";
  return "earth";
};

const formatBjIsoToZhText = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return iso;
  const sec = m[6] ? `:${m[6]}` : "";
  return `${m[1]}年${m[2]}月${m[3]}日 ${m[4]}:${m[5]}${sec}`;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

type DerivedHiddenStem = { stem: string; tenGod: string };
type DerivedPillarDetail = {
  stem?: { name?: string; tenGod?: string | null };
  branch?: {
    name?: string;
    hiddenStems?: {
      main?: DerivedHiddenStem;
      middle?: DerivedHiddenStem;
      residual?: DerivedHiddenStem;
    };
  };
  starLuck?: string;
  selfSeat?: string;
  kongWang?: string;
  nayin?: string;
};

type DerivedBazi = {
  dayMaster?: string;
  baziText?: string;
  zodiac?: string;
  pillarsDetail?: {
    year?: DerivedPillarDetail;
    month?: DerivedPillarDetail;
    day?: DerivedPillarDetail;
    hour?: DerivedPillarDetail;
  };
  shenSha?: { year?: unknown; month?: unknown; day?: unknown; hour?: unknown };
  decadeFortune?: { startDate?: string };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isDerivedPillarDetail(v: unknown): v is DerivedPillarDetail {
  return isRecord(v);
}

function parseDerivedBazi(v: unknown): DerivedBazi | null {
  if (!isRecord(v)) return null;
  return v as DerivedBazi;
}

const transformToFullAnalysis = (params: {
  recordSubject: string;
  customerGender?: "male" | "female" | "other";
  baziData: BaZiData;
}) => {
  const d = params.baziData;
  const derived = parseDerivedBazi(d.derived ?? null);

  const hasDerivedPillars = Boolean(
    derived?.pillarsDetail?.year && derived?.pillarsDetail?.month && derived?.pillarsDetail?.day && derived?.pillarsDetail?.hour,
  );

  if (hasDerivedPillars) {
    const pd = derived?.pillarsDetail ?? {};
    const shenSha = derived?.shenSha ?? {};

    const fromPillar = (label: string, p: unknown, sha: unknown, isDay?: boolean) => {
      if (!isDerivedPillarDetail(p)) {
        return {
          label,
          mainStar: isDay ? "日主" : "",
          stem: "",
          stemEl: "earth" as const,
          branch: "",
          branchEl: "earth" as const,
          hiddenStems: [] as Array<{ s: string; g: string; e: keyof typeof ELEMENT_STYLES }>,
          luck: "",
          sitting: "",
          void: "",
          nayyin: "",
          sha: toStringArray(sha),
        };
      }

      const hidden = [
        p.branch?.hiddenStems?.main,
        p.branch?.hiddenStems?.middle,
        p.branch?.hiddenStems?.residual,
      ]
        .filter(Boolean)
        .map((hs) => ({
          s: String((hs as DerivedHiddenStem).stem ?? ""),
          g: String((hs as DerivedHiddenStem).tenGod ?? ""),
          e: getElByStem(String((hs as DerivedHiddenStem).stem ?? "")),
        }))
        .filter((hs) => hs.s);

      const shaList = toStringArray(sha);
      const stem = String(p.stem?.name ?? "");
      const branch = String(p.branch?.name ?? "");

      return {
        label,
        mainStar: isDay ? "日主" : String(p.stem?.tenGod ?? ""),
        stem,
        stemEl: getElByStem(stem),
        branch,
        branchEl: getElByBranch(branch),
        hiddenStems: hidden,
        luck: String(p.starLuck ?? ""),
        sitting: String(p.selfSeat ?? ""),
        void: String(p.kongWang ?? ""),
        nayyin: String(p.nayin ?? ""),
        sha: shaList,
      };
    };

    return {
      subject: params.recordSubject,
      solarDate: formatBjIsoToZhText(d.birthDate),
      gender:
        params.customerGender === "female"
          ? "坤造"
          : params.customerGender === "male"
            ? "乾造"
            : "命造",
      pillars: [
        fromPillar("年柱", pd.year, shenSha.year),
        fromPillar("月柱", pd.month, shenSha.month),
        fromPillar("日柱", pd.day, shenSha.day, true),
        fromPillar("时柱", pd.hour, shenSha.hour),
      ],
      tgNotes: `日主：${String(derived?.dayMaster ?? "")}；八字：${String(derived?.baziText ?? "")}`,
      dzNotes: `生肖：${String(derived?.zodiac ?? "")}；起运：${String(derived?.decadeFortune?.startDate ?? "")}`,
    };
  }

  return {
    subject: params.recordSubject,
    solarDate: formatBjIsoToZhText(d.birthDate),
    gender:
      params.customerGender === "female"
        ? "坤造"
        : params.customerGender === "male"
          ? "乾造"
          : "命造",
    pillars: [
      {
        label: "年柱",
        mainStar: "正印",
        stem: d.yearStem,
        stemEl: getElByStem(d.yearStem),
        branch: d.yearBranch,
        branchEl: getElByBranch(d.yearBranch),
        hiddenStems: [{ s: "辛", g: "正财", e: "metal" }],
        luck: "死",
        sitting: "绝",
        void: "午未",
        nayyin: "泉中水",
        sha: ["天乙贵人", "太极贵人"],
      },
      {
        label: "月柱",
        mainStar: "食神",
        stem: d.monthStem,
        stemEl: getElByStem(d.monthStem),
        branch: d.monthBranch,
        branchEl: getElByBranch(d.monthBranch),
        hiddenStems: [
          { s: "甲", g: "偏印", e: "wood" },
          { s: "丙", g: "比肩", e: "fire" },
          { s: "戊", g: "食神", e: "earth" },
        ],
        luck: "长生",
        sitting: "长生",
        void: "申酉",
        nayyin: "城头土",
        sha: ["福星贵人", "德秀贵人", "红艳煞", "劫煞", "元辰"],
      },
      {
        label: "日柱",
        mainStar: "日主",
        stem: d.dayStem,
        stemEl: getElByStem(d.dayStem),
        branch: d.dayBranch,
        branchEl: getElByBranch(d.dayBranch),
        hiddenStems: [
          { s: "戊", g: "食神", e: "earth" },
          { s: "辛", g: "正财", e: "metal" },
          { s: "丁", g: "劫财", e: "fire" },
        ],
        luck: "墓",
        sitting: "墓",
        void: "午未",
        nayyin: "屋上土",
        sha: ["月德贵人", "德秀贵人", "童子煞"],
      },
      {
        label: "时柱",
        mainStar: "伤官",
        stem: d.hourStem,
        stemEl: getElByStem(d.hourStem),
        branch: d.hourBranch,
        branchEl: getElByBranch(d.hourBranch),
        hiddenStems: [
          { s: "己", g: "伤官", e: "earth" },
          { s: "癸", g: "正官", e: "water" },
          { s: "辛", g: "正财", e: "metal" },
        ],
        luck: "养",
        sitting: "墓",
        void: "午未",
        nayyin: "霹雳火",
        sha: ["福星贵人", "国印贵人", "华盖", "天医", "血刃"],
      },
    ],
    tgNotes: "原局天干顺生，五行流通，气势纯正。",
    dzNotes: "地支合化，财官得位，注意午未空亡之影响。",
  };
};

const EXTRA_ROWS = [
  { key: "luck", label: "星运" },
  { key: "sitting", label: "自坐" },
  { key: "void", label: "空亡" },
  { key: "nayyin", label: "纳音" },
] as const;

const EMPTY_HISTORY: Message[] = [];

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToastStore();

  const records = useCaseStore((state) => state.records);
  const recordStatus = useCaseStore((state) => state.status);
  const recordHasHydrated = useCaseStore((state) => state.hasHydrated);
  const customers = useCustomerStore((state) => state.customers);
  const customerStatus = useCustomerStore((state) => state.status);
  const customerHasHydrated = useCustomerStore((state) => state.hasHydrated);

  const record = records.find((r) => r.id === id && r.module === "bazi");
  const customer = record?.customerId ? customers.find((c) => c.id === record.customerId) : null;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const history = useChatStore((state) => state.chatHistories[id] || EMPTY_HISTORY);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearHistory = useChatStore((state) => state.clearHistory);

  const analysis = useMemo(() => {
    if (!record?.baziData) return null;
    return transformToFullAnalysis({
      recordSubject: record.subject,
      customerGender: customer?.gender,
      baziData: record.baziData,
    });
  }, [customer?.gender, record]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async () => {
    if (!inputText.trim() || !analysis) return;
    const userText = inputText;
    addMessage(id, { role: "user", text: userText, timestamp: Date.now() });
    setInputText("");
    setIsTyping(true);
    try {
      const systemInstruction = `你是一位专业命理师。当前案卷：${analysis.subject}。四柱：年${analysis.pillars[0].stem}${analysis.pillars[0].branch}、月${analysis.pillars[1].stem}${analysis.pillars[1].branch}、日${analysis.pillars[2].stem}${analysis.pillars[2].branch}、时${analysis.pillars[3].stem}${analysis.pillars[3].branch}。请根据排盘回答用户追问。语气雅致、简洁、扁平。不使用Emoji。`;

      const messages: ChatMessage[] = [
        ...history.map((m): ChatMessage => ({ role: m.role, text: m.text })),
        { role: "user", text: userText },
      ];

      const text = await geminiChat({
        systemInstruction,
        messages,
      });

      addMessage(id, { role: "model", text: text || "...", timestamp: Date.now() });
    } catch (e) {
      console.error(e);
      toast.show("助手调用失败，请稍后重试", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const isLoading =
    !recordHasHydrated ||
    !customerHasHydrated ||
    recordStatus === "loading" ||
    customerStatus === "loading" ||
    recordStatus === "idle" ||
    customerStatus === "idle";

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-[#2F2F2F]/30 chinese-font italic">加载中…</p>
      </div>
    );
  }

  if (!record || !analysis) {
    return (
      <div className="py-24 text-center">
        <p className="text-[#2F2F2F]/20 chinese-font italic">未找到该八字卷宗</p>
        <div className="mt-6">
          <button
            onClick={() => router.push("/bazi")}
            className="px-4 py-2 border border-[#B37D56]/20 text-xs font-bold tracking-widest rounded-[2px] hover:bg-[#B37D56]/5"
          >
            返回案卷库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#B37D56]/10 pb-6 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bazi")}
              className="text-[#B37D56] text-[10px] font-bold tracking-[0.2em] uppercase hover:underline underline-offset-4"
            >
              返回
            </button>
            <span className="text-[10px] text-[#2F2F2F]/20">/</span>
            <span className="text-[10px] text-[#2F2F2F]/40 font-bold tracking-widest uppercase">
              {analysis.gender}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#2F2F2F] chinese-font">{analysis.subject}</h2>
          <p className="text-[10px] text-[#2F2F2F]/40 chinese-font tracking-widest uppercase">
            {customer?.name ? `${customer.name} · ` : ""}
            {analysis.solarDate}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPanelOpen(true)}
            className="text-[#B37D56] text-[10px] font-bold tracking-[0.2em] uppercase border border-[#B37D56]/20 px-4 py-2 rounded-[2px] hover:bg-[#B37D56]/5"
          >
            探讨易理
          </button>
          <Link
            href={`/bazi/edit/${encodeURIComponent(id)}`}
            className="bg-[#2F2F2F] text-white px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase rounded-[2px] hover:bg-black"
          >
            编辑案卷
          </Link>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white border border-[#B37D56]/15 overflow-hidden rounded-none">
          <table className="w-full text-center border-collapse table-fixed">
            <thead>
              <tr className="bg-[#FAF7F2]/50 border-b border-[#B37D56]/10">
                <th className="py-4 text-[9px] text-[#2F2F2F]/30 uppercase font-bold tracking-[0.3em] w-16">
                  项目
                </th>
                {analysis.pillars.map((p) => (
                  <th
                    key={p.label}
                    className="py-4 text-xs text-[#B37D56] font-bold chinese-font tracking-[0.5em]"
                  >
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B37D56]/10">
              <tr>
                <td className="py-4 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  主星
                </td>
                {analysis.pillars.map((p, i) => (
                  <td key={i} className="py-4 text-sm text-[#2F2F2F] chinese-font font-bold">
                    {p.mainStar}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-8 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  天干
                </td>
                {analysis.pillars.map((p, i) => (
                  <td key={i} className="py-8">
                    <span
                      className="text-5xl font-bold chinese-font leading-none"
                      style={{ color: ELEMENT_STYLES[p.stemEl].color }}
                    >
                      {p.stem}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-8 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  地支
                </td>
                {analysis.pillars.map((p, i) => (
                  <td key={i} className="py-8">
                    <span
                      className="text-5xl font-bold chinese-font leading-none"
                      style={{ color: ELEMENT_STYLES[p.branchEl].color }}
                    >
                      {p.branch}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-6 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  藏干
                </td>
                {analysis.pillars.map((p, i) => (
                  <td key={i} className="py-6 space-y-1">
                    {p.hiddenStems.map((hs, hidx) => (
                      <div
                        key={hidx}
                        className="text-xs font-bold chinese-font"
                        style={{ color: ELEMENT_STYLES[hs.e].color }}
                      >
                        {hs.s}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-6 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  副星
                </td>
                {analysis.pillars.map((p, i) => (
                  <td key={i} className="py-6 space-y-1">
                    {p.hiddenStems.map((hs, hidx) => (
                      <div key={hidx} className="text-[10px] text-[#2F2F2F]/40 chinese-font">
                        {hs.g}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
              {EXTRA_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="py-4 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                    {row.label}
                  </td>
                  {analysis.pillars.map((p, i) => (
                    <td key={i} className="py-4 text-[11px] text-[#2F2F2F] chinese-font font-bold">
                      {p[row.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-8 text-[9px] text-[#2F2F2F]/30 font-bold uppercase tracking-widest bg-[#FAF7F2]/30">
                  神煞
                </td>
                {analysis.pillars.map((p, i) => (
                  <td
                    key={i}
                    className="py-8 px-2 space-y-1.5 text-[10px] text-[#B37D56] chinese-font leading-tight font-medium"
                  >
                    {p.sha.map((s: string, sidx: number) => (
                      <div key={sidx}>{s}</div>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-[#B37D56]/15 p-10 space-y-10 rounded-[4px] shadow-none">
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold text-[#B37D56] uppercase tracking-[0.3em] border-b border-[#B37D56]/15 pb-2">
                命局关系
              </h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-[#B37D56]/40 uppercase tracking-widest">
                    天干理法
                  </span>
                  <p className="text-[13px] text-[#2F2F2F] chinese-font leading-relaxed font-bold">
                    {analysis.tgNotes}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-[#B37D56]/40 uppercase tracking-widest">
                    地支神煞
                  </span>
                  <p className="text-[13px] text-[#2F2F2F] chinese-font leading-relaxed font-bold">
                    {analysis.dzNotes}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-[#B37D56] uppercase tracking-[0.3em] border-b border-[#B37D56]/15 pb-2">
                备注
              </h3>
              <p className="text-[12px] text-[#2F2F2F]/40 chinese-font leading-relaxed">
                {record.notes?.trim() ? record.notes : "（暂无备注）"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <div className="fixed inset-0 bg-black/10 z-[60] flex justify-end">
          <div className="w-[360px] bg-white border-l border-[#B37D56]/20 flex flex-col h-full shadow-none">
            <div className="p-5 border-b border-[#B37D56]/10 bg-[#FAF7F2] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold chinese-font text-[#2F2F2F] tracking-widest">
                  易理探讨
                </span>
                <button
                  onClick={() => {
                    clearHistory(id);
                    toast.show("已清空对话", "info");
                  }}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2F2F2F]/30 hover:text-[#A62121]"
                >
                  清空
                </button>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-[#2F2F2F]/30 uppercase text-[10px] hover:text-[#A62121]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-xs border chinese-font leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#FAF7F2] border-[#B37D56]/20 ml-8"
                      : "bg-white border-black/10 mr-8"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="p-3 text-xs border border-black/10 mr-8 text-[#2F2F2F]/40">
                  正在推演...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-5 border-t border-[#B37D56]/10 bg-white space-y-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSend();
                }}
                placeholder="请问..."
                className="w-full bg-[#FAF7F2] border border-[#B37D56]/20 px-3 py-2 text-xs outline-none rounded-[2px]"
              />
              <button
                onClick={() => void handleSend()}
                disabled={isTyping || inputText.trim().length === 0}
                className="w-full h-10 bg-[#2F2F2F] text-white font-bold chinese-font tracking-[0.4em] rounded-[2px] hover:bg-black disabled:opacity-40 disabled:hover:bg-[#2F2F2F] transition-all"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
