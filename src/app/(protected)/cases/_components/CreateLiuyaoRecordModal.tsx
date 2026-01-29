"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { ChineseDatePicker } from "@/components/ChineseDatePicker";
import { ChineseTimePicker } from "@/components/ChineseTimePicker";
import { LiuyaoLineSvg } from "@/components/liuyao/LiuyaoLineSvg";
import { calcLiuyaoGanzhiFromIso } from "@/lib/lunarGanzhi";
import { recordEditHref } from "@/lib/caseLinks";
import { LineType, type LiuYaoData } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useToastStore } from "@/stores/useToastStore";

const pad2 = (n: number) => n.toString().padStart(2, "0");

const isoTimeToHHmm = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const setIsoTime = (iso: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  const d = new Date(iso);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
};

const LINE_OPTIONS: Array<{ value: LineType; label: string }> = [
  { value: LineType.SHAO_YANG, label: "少阳" },
  { value: LineType.SHAO_YIN, label: "少阴" },
  { value: LineType.LAO_YANG, label: "老阳（动）" },
  { value: LineType.LAO_YIN, label: "老阴（动）" },
];

export function CreateLiuyaoRecordModal({
  open,
  onClose,
  initialCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const accessToken = useAuthStore((s) => s.accessToken);
  const upsertLiuyaoRemote = useCaseStore((s) => s.upsertLiuyaoRemote);
  const customers = useCustomerStore((s) => s.customers);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [dateIso, setDateIso] = useState(() => new Date().toISOString());
  const [timeHHmm, setTimeHHmm] = useState(() => isoTimeToHHmm(new Date().toISOString()));
  const [lines, setLines] = useState<LineType[]>([
    LineType.SHAO_YANG,
    LineType.SHAO_YANG,
    LineType.SHAO_YANG,
    LineType.SHAO_YANG,
    LineType.SHAO_YANG,
    LineType.SHAO_YANG,
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!open) return;
    const nowIso = new Date().toISOString();
    setIsSubmitting(false);
    setSubject("");
    setCustomerId((initialCustomerId ?? "").trim());
    setDateIso(nowIso);
    setTimeHHmm(isoTimeToHHmm(nowIso));
    setLines([
      LineType.SHAO_YANG,
      LineType.SHAO_YANG,
      LineType.SHAO_YANG,
      LineType.SHAO_YANG,
      LineType.SHAO_YANG,
      LineType.SHAO_YANG,
    ]);
    setTags([]);
    setNewTag("");
  }, [initialCustomerId, open]);

  const recordIso = useMemo(() => setIsoTime(dateIso, timeHHmm || "00:00"), [dateIso, timeHHmm]);

  const ganzhi = useMemo(() => calcLiuyaoGanzhiFromIso(recordIso), [recordIso]);
  const monthBranch = ganzhi?.monthBranch ?? "子";
  const dayBranch = ganzhi?.dayGanzhi ?? "甲子";

  const setLineAtIndex = (index: number, nextLine: LineType) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = nextLine;
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[220] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#B37D56]/10 flex justify-between items-center">
          <p className="text-xs font-bold tracking-widest chinese-font text-[#2F2F2F]">
            新建六爻卦例
          </p>
          <button
            onClick={onClose}
            className="text-[#2F2F2F]/20 hover:text-[#A62121]"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2 group">
                  <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                    关联客户（可选）
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
                  >
                    <option value="">-- 不绑定 --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                    咨询主题
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="如：问来年财运..."
                    className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <ChineseDatePicker label="起卦日期" value={dateIso} onChange={setDateIso} />
                <ChineseTimePicker label="起卦时间" value={timeHHmm} onChange={setTimeHHmm} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                    月建
                  </label>
                  <div className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1.5 font-bold chinese-font">
                    {monthBranch}月
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                    日辰
                  </label>
                  <div className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1.5 font-bold chinese-font">
                    {dayBranch}日
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] text-[#B37D56] font-bold uppercase tracking-[0.4em]">
                Tags（可选）
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-[#FAF7F2] text-[#2F2F2F] px-2 py-1 border border-[#B37D56]/10 flex items-center gap-1"
                  >
                    {t}{" "}
                    <button
                      onClick={() => setTags(tags.filter((tag) => tag !== t))}
                      className="text-[#A62121] hover:font-bold"
                      aria-label={`移除标签 ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key !== "Enter") return;
                    const next = newTag.trim();
                    if (!next) return;
                    setTags((prev) => (prev.includes(next) ? prev : [...prev, next]));
                    setNewTag("");
                  }}
                  placeholder="新增标签"
                  className="flex-1 bg-transparent border-b border-[#2F2F2F]/10 py-1 text-xs outline-none focus:border-[#A62121]"
                />
                <button
                  onClick={() => {
                    const next = newTag.trim();
                    if (!next) return;
                    setTags((prev) => (prev.includes(next) ? prev : [...prev, next]));
                    setNewTag("");
                  }}
                  className="text-[#A62121]"
                  aria-label="添加标签"
                >
                  <Plus size={18} />
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#FAF7F2]/40 p-6 border border-[#B37D56]/10 rounded-none">
              <h3 className="text-center text-[10px] text-[#B37D56] mb-6 tracking-[0.5em] font-bold uppercase">
                六爻（自下而上）
              </h3>
              <div className="flex flex-col-reverse gap-3 items-stretch">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[3rem_minmax(0,1fr)_7rem] items-center gap-3 py-2 px-3 border border-transparent hover:bg-black/[0.01]"
                  >
                    <span className="text-[9px] font-bold text-[#2F2F2F]/20 chinese-font">
                      爻{idx + 1}
                    </span>
                    <div className="flex justify-center min-w-0">
                      <LiuyaoLineSvg
                        line={line}
                        className="h-6 w-full max-w-[160px]"
                        lineColor="#2F2F2F"
                        markColor="#A62121"
                      />
                    </div>
                    <select
                      aria-label={`第 ${idx + 1} 爻`}
                      value={line}
                      onChange={(e) => setLineAtIndex(idx, Number(e.target.value) as LineType)}
                      className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1 text-[10px] outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
                    >
                      {LINE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[10px] text-center text-[#2F2F2F]/30 chinese-font italic leading-loose">
                每一爻四选一：少阳 / 少阴 / 老阳（动） / 老阴（动）
              </p>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-[#B37D56]/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#B37D56]/20 text-[#2F2F2F] text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-[#FAF7F2] transition-all"
          >
            取消
          </button>
          <button
            disabled={isSubmitting}
            onClick={async () => {
              if (!accessToken) {
                showToast("未登录或登录已过期", "error");
                return;
              }

              const trimmedSubject = subject.trim();
              if (!trimmedSubject) {
                showToast("请填写咨询主题", "error");
                return;
              }

              setIsSubmitting(true);
              try {
                const normalizedCustomerId = customerId.trim() ? customerId.trim() : null;
                const customer = normalizedCustomerId
                  ? customers.find((c) => c.id === normalizedCustomerId)
                  : undefined;

                const liuyaoData: LiuYaoData = {
                  lines,
                  date: recordIso,
                  subject: trimmedSubject,
                  monthBranch,
                  dayBranch,
                };

                const id = await upsertLiuyaoRemote(accessToken, {
                  payload: {
                    customerId: normalizedCustomerId,
                    customerName: customer?.name ?? null,
                    subject: trimmedSubject,
                    notes: "",
                    tags,
                    liuyaoData,
                    verifiedStatus: "unverified",
                    verifiedNotes: "",
                  },
                });

                showToast("已创建六爻卦例", "success");
                onClose();
                router.push(recordEditHref("liuyao", id));
              } catch {
                showToast("创建失败，请稍后重试", "error");
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="px-8 py-2 bg-[#2F2F2F] text-white text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
