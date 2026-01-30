
"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ANIMALS } from "@/lib/constants";
import { geminiChat, type ChatMessage } from "@/lib/geminiService";
import { paipanLiuyao } from "@/lib/liuyao/paipan";
import { LiuyaoLineSvg } from "@/components/liuyao/LiuyaoLineSvg";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore, type Message } from "@/stores/useChatStore";
import { useToastStore } from "@/stores/useToastStore";

const EMPTY_HISTORY: Message[] = [];

const WUXING_COLORS: Record<string, string> = {
  木: "#40de5a",
  火: "#ff2d51",
  土: "#5d513c",
  金: "#eacd76",
  水: "#065279",
};

const getWuxingColor = (el: string) => WUXING_COLORS[el] ?? WUXING_COLORS["土"];

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncLiuyaoFromApi = useCaseStore((s) => s.syncLiuyaoFromApi);

  const records = useCaseStore((state) => state.records);
  const recordStatus = useCaseStore((state) => state.status);
  const recordHasHydrated = useCaseStore((state) => state.hasHydrated);
  const customers = useCustomerStore((state) => state.customers);
  const customerStatus = useCustomerStore((state) => state.status);
  const customerHasHydrated = useCustomerStore((state) => state.hasHydrated);

  const record = records.find((r) => r.id === id && r.module === "liuyao");
  const customer = record?.customerId ? customers.find((c) => c.id === record.customerId) : null;
  const customerName = record?.customerName ?? customer?.name ?? null;

  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const history = useChatStore((state) => state.chatHistories[id] || EMPTY_HISTORY);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearHistory = useChatStore((state) => state.clearHistory);

  const analysis = useMemo(() => {
    if (!record?.liuyaoData) return null;
    const d = record.liuyaoData;
    const dt = new Date(d.date);
    const solarDate = Number.isNaN(dt.getTime()) ? d.date : dt.toLocaleString("zh-CN");
    return {
      subject: record.subject || d.subject || "卦例",
      solarDate,
      monthBranch: d.monthBranch,
      dayBranch: d.dayBranch,
      lines: d.lines,
    };
  }, [record]);

  const paipan = useMemo(() => {
    if (!record?.liuyaoData) return null;
    try {
      return paipanLiuyao(record.liuyaoData);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [record]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    if (record) return;
    if (!accessToken) return;
    setIsLoadingRecord(true);
    void syncLiuyaoFromApi(accessToken)
      .catch(() => {
        showToast("加载六爻记录失败，请稍后重试", "warning");
      })
      .finally(() => setIsLoadingRecord(false));
  }, [accessToken, record, showToast, syncLiuyaoFromApi]);

  const handleSend = async () => {
    if (!inputText.trim() || !analysis) return;
    const userText = inputText;
    addMessage(id, { role: "user", text: userText, timestamp: Date.now() });
    setInputText("");
    setIsTyping(true);
    try {
      const systemInstruction = `你是一位专业六爻师。当前卦例：${analysis.subject}。月建：${analysis.monthBranch}，日辰：${analysis.dayBranch}。请根据排盘与问事语境回答追问，语气扁平文字化，不使用Emoji。`;

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
      showToast("助手调用失败，请稍后重试", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const isLoading =
    isLoadingRecord ||
    !recordHasHydrated ||
    !customerHasHydrated ||
    recordStatus === "loading" ||
    customerStatus === "loading" ||
    recordStatus === "idle" ||
    customerStatus === "idle";

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-[#6B6B6B] chinese-font italic text-sm">加载中…</p>
      </div>
    );
  }

  if (!record || !analysis) {
    return (
      <div className="py-24 text-center">
        <p className="text-[#6B6B6B] chinese-font italic text-sm">未找到该六爻卦例</p>
        <div className="mt-6">
          <button
            onClick={() => router.push("/liuyao")}
            className="px-4 py-2 border border-[#B37D56]/20 text-xs font-bold tracking-widest rounded-[2px] hover:bg-[#B37D56]/5"
          >
            返回卦例库
          </button>
        </div>
      </div>
    );
  }

  const linesFromTop = paipan ? [...paipan.lines].reverse() : null;
  const baseTitle = paipan?.base.name
    ? `${paipan.base.name}${paipan.palace.name ? `（${paipan.palace.name}宫）` : ""}${
        paipan.palace.generation && paipan.palace.generation !== "本宫" ? `-${paipan.palace.generation}` : ""
      }`
    : null;
  const changedTitle = paipan?.changed.name
    ? `${paipan.changed.name}${paipan.changedPalace.name ? `（${paipan.changedPalace.name}宫）` : ""}${
        paipan.changedPalace.generation && paipan.changedPalace.generation !== "本宫"
          ? `-${paipan.changedPalace.generation}`
          : ""
      }`
    : null;

  return (
    <div className="relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#B37D56]/10 pb-6 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/liuyao")}
              className="text-[#B37D56] text-[10px] font-bold tracking-[0.2em] uppercase hover:underline underline-offset-4"
            >
              返回
            </button>
          </div>
          <h2 className="text-2xl font-bold text-[#2F2F2F] chinese-font">{analysis.subject}</h2>
          <p className="text-xs text-[#5A5A5A] chinese-font tracking-widest uppercase">
            {customerName ? `${customerName} · ` : ""}
            {analysis.solarDate} · 月建{analysis.monthBranch} · 日辰{analysis.dayBranch}
          </p>
          {paipan?.base.name && (
            <p className="text-xs text-[#8B6A52] chinese-font tracking-widest uppercase mt-1">
              本卦{paipan.base.name}
              {paipan.changed.name ? ` · 变卦${paipan.changed.name}` : ""}
              {paipan.palace.name && paipan.palace.generation
                ? ` · ${paipan.palace.name}宫${paipan.palace.generation}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPanelOpen(true)}
            className="text-[#B37D56] text-xs font-bold tracking-[0.2em] uppercase border border-[#B37D56]/20 px-4 py-2 rounded-[2px] hover:bg-[#B37D56]/5"
          >
            助手
          </button>
          <Link
            href={`/liuyao/edit/${encodeURIComponent(id)}`}
            className="bg-[#A62121] text-white px-5 py-2 text-xs font-bold tracking-[0.2em] uppercase rounded-[2px] hover:bg-[#8B1A1A]"
          >
            修改
          </Link>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#B37D56]/15 p-8 space-y-8 rounded-none">
          <div className="grid grid-cols-[4rem_7rem_minmax(0,1fr)_3rem_2.5rem_4rem_7rem_minmax(0,1fr)_3rem] gap-0">
            <div className="col-span-4 text-[11px] text-[#8B6A52] font-bold py-2 tracking-widest text-center">
              {baseTitle ?? "本卦"}
            </div>
            <div className="py-2" />
            <div className="col-span-4 text-[11px] text-[#8B6A52] font-bold py-2 tracking-widest text-center">
              {changedTitle ?? "变卦"}
            </div>

            {(
              [
                "六神",
                "六亲",
                "爻",
                "世应",
                "发动",
                "六神",
                "六亲",
                "爻",
                "世应",
              ] as const
            ).map((label) => (
              <div
                key={label}
                className="text-[10px] text-[#8B6A52] font-bold py-3 uppercase tracking-widest text-center border-b border-[#B37D56]/10"
              >
                {label}
              </div>
            ))}

            {(linesFromTop ?? []).map((line, idxFromTop) => {
              const sixGodText = line.sixGod ?? ANIMALS[idxFromTop % 6];
              const movingMarkText = line.moveMark === "O" ? "○" : line.moveMark === "X" ? "×" : line.moveMark;

              const baseShiying = `${line.isShi ? "世" : ""}${line.isYing ? "应" : ""}`;
              const changedShiying = `${line.changedIsShi ? "世" : ""}${line.changedIsYing ? "应" : ""}`;

              return (
                <React.Fragment key={idxFromTop}>
                  <div className="flex items-center justify-center text-[11px] text-[#5A5A5A] font-bold py-4 border-t border-[#B37D56]/5">
                    {sixGodText}
                  </div>

	                  <div className="flex items-center justify-end py-4 px-3 border-t border-[#B37D56]/5">
	                    <div className="text-xs font-bold text-[#4A4A4A] chinese-font leading-tight text-right">
	                      {line.relative} {line.najia.text}
	                      <span style={{ color: getWuxingColor(line.najia.element) }}>{line.najia.element}</span>
	                    </div>
	                  </div>

                  <div className="flex items-center justify-center py-4 border-t border-[#B37D56]/5">
                    <LiuyaoLineSvg
                      line={line.lineType}
                      className="h-6 w-full max-w-[220px]"
                      lineColor="#2F2F2F"
                      markColor="#A62121"
                      showMark={false}
                    />
                  </div>

                  <div className="flex items-center justify-center py-4 border-t border-[#B37D56]/5">
                    {baseShiying ? (
                      <div className="flex gap-1">
                        {line.isShi && (
                          <span className="text-xs font-bold text-[#A62121] chinese-font tracking-widest">世</span>
                        )}
                        {line.isYing && (
                          <span className="text-xs font-bold text-[#4A4A4A] chinese-font tracking-widest">应</span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-center py-4 border-t border-[#B37D56]/5">
                    {line.isMoving ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 border border-[#A62121] bg-[#FAF7F2] text-[#A62121] text-lg font-black rounded-[2px]">
                        {movingMarkText}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-center text-[11px] text-[#5A5A5A] font-bold py-4 border-t border-[#B37D56]/5">
                    {sixGodText}
                  </div>

	                  <div className="flex items-center justify-end py-4 px-3 border-t border-[#B37D56]/5">
	                    <div className="text-xs font-bold text-[#4A4A4A] chinese-font leading-tight text-right">
	                      {line.changedRelative} {line.changedNajia.text}
	                      <span style={{ color: getWuxingColor(line.changedNajia.element) }}>
	                        {line.changedNajia.element}
	                      </span>
	                    </div>
	                  </div>

                  <div className="flex items-center justify-center py-4 border-t border-[#B37D56]/5">
                    <LiuyaoLineSvg
                      line={line.changedLineType}
                      className="h-6 w-full max-w-[220px]"
                      lineColor="#2F2F2F"
                      markColor="#A62121"
                      showMark={false}
                    />
                  </div>

                  <div className="flex items-center justify-center py-4 border-t border-[#B37D56]/5">
                    {changedShiying ? (
                      <div className="flex gap-1">
                        {line.changedIsShi && (
                          <span className="text-xs font-bold text-[#A62121] chinese-font tracking-widest">世</span>
                        )}
                        {line.changedIsYing && (
                          <span className="text-xs font-bold text-[#4A4A4A] chinese-font tracking-widest">应</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-[#B37D56]/15 p-8 space-y-8 rounded-[4px] shadow-none">
          <h3 className="text-xs font-bold text-[#B37D56] uppercase border-b border-[#B37D56]/15 pb-2 tracking-[0.3em]">
            断语简析
          </h3>
          <div className="space-y-4 text-[15px] chinese-font leading-relaxed">
            <p className="border-l border-[#B37D56]/30 pl-4 font-bold text-[#2F2F2F]">
              （占断模板）以用神、世应、动变为纲，结合月建日辰定旺衰。
            </p>
            <p className="border-l border-black/10 pl-4 text-[#4A4A4A]">
              {record.notes?.trim() ? record.notes : "（暂无备注）"}
            </p>
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <div className="fixed inset-0 bg-black/10 z-[60] flex justify-end">
          <div className="w-[360px] bg-white border-l border-[#B37D56]/20 flex flex-col h-full shadow-none">
            <div className="p-5 border-b border-[#B37D56]/10 bg-[#FAF7F2] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold chinese-font text-[#2F2F2F] tracking-widest">
                  易理探讨
                </span>
                <button
                  onClick={() => {
                    clearHistory(id);
                    showToast("已清空对话", "info");
                  }}
                  className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#A62121]"
                >
                  清空
                </button>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-[#6B6B6B] uppercase text-[11px] hover:text-[#A62121]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-sm border chinese-font leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#FAF7F2] border-[#B37D56]/20 ml-8"
                      : "bg-white border-black/10 mr-8"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="p-3 text-sm border border-black/10 mr-8 text-[#6B6B6B]">
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
                placeholder="咨询..."
                className="w-full bg-[#FAF7F2] border border-[#B37D56]/20 px-3 py-2 text-sm outline-none rounded-[2px]"
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
