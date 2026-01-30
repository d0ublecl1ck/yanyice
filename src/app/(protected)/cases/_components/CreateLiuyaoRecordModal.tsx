"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { ChineseDatePicker } from "@/components/ChineseDatePicker";
import { ChineseTimePicker } from "@/components/ChineseTimePicker";
import { Select, type SelectOption } from "@/components/Select";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/Modal";
import { LiuyaoLineSvg } from "@/components/liuyao/LiuyaoLineSvg";
import { AiRecognitionModal } from "@/components/ai/AiRecognitionModal";
import { scrollAndFlash } from "@/lib/scrollFlash";
import { calcLiuyaoGanzhiFromIso } from "@/lib/lunarGanzhi";
import { LineType, type LiuYaoData } from "@/lib/types";
import { useAiConfigStore } from "@/stores/useAiConfigStore";
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

const LINE_OPTIONS: Array<SelectOption<LineType>> = [
  { value: LineType.SHAO_YANG, label: "少阳" },
  { value: LineType.SHAO_YIN, label: "少阴" },
  { value: LineType.LAO_YANG, label: "老阳（动）" },
  { value: LineType.LAO_YIN, label: "老阴（动）" },
];

const LINE_LABELS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

export function CreateLiuyaoRecordModal({
  open,
  onClose,
  initialCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}) {
  const showToast = useToastStore((s) => s.show);
  const aiModel = useAiConfigStore((s) => s.model);
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
  const [overrideMonthBranch, setOverrideMonthBranch] = useState<string | null>(null);
  const [overrideDayBranch, setOverrideDayBranch] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const monthDayRef = useRef<HTMLDivElement | null>(null);
  const linesSectionRef = useRef<HTMLElement | null>(null);

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
    setOverrideMonthBranch(null);
    setOverrideDayBranch(null);
    setAiOpen(false);
  }, [initialCustomerId, open]);

  const recordIso = useMemo(() => setIsoTime(dateIso, timeHHmm || "00:00"), [dateIso, timeHHmm]);

  const ganzhi = useMemo(() => calcLiuyaoGanzhiFromIso(recordIso), [recordIso]);
  const derivedMonthBranch = ganzhi?.monthBranch ?? "子";
  const derivedDayBranch = ganzhi?.dayGanzhi ?? "甲子";
  const monthBranch = overrideMonthBranch ?? derivedMonthBranch;
  const dayBranch = overrideDayBranch ?? derivedDayBranch;

  const setLineAtIndex = (index: number, nextLine: LineType) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = nextLine;
      return next;
    });
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="新建六爻卦谱"
      onClose={onClose}
      size="md"
      maxHeightClassName="max-h-[90vh]"
      scrollBody
      hideScrollbar
      bodyClassName="p-6"
      headerActions={
        <button
          type="button"
          aria-label="AI 智能识盘"
          title="AI 智能识盘"
          onClick={() => {
            if (!aiModel.trim()) {
              showToast("请先在设置中配置模型", "warning");
              return;
            }
            setAiOpen(true);
          }}
          className="p-2 text-[#B37D56]/60 hover:text-[#A62121] hover:bg-[#A62121]/5 transition-all rounded-[2px]"
        >
          <Sparkles size={18} />
        </button>
      }
      footer={
        <div className="flex justify-end gap-3">
          <ModalSecondaryButton onClick={onClose}>取消</ModalSecondaryButton>
          <ModalPrimaryButton
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

                await upsertLiuyaoRemote(accessToken, {
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

                showToast("已创建六爻卦谱", "success");
                onClose();
              } catch {
                showToast("创建失败，请稍后重试", "error");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? "创建中..." : "创建"}
          </ModalPrimaryButton>
        </div>
      }
    >
      <AiRecognitionModal
        open={aiOpen}
        target="liuyao"
        onClose={() => setAiOpen(false)}
        onRecognized={(result) => {
          const nextSubject = typeof result.subject === "string" ? result.subject.trim() : "";
          if (nextSubject) setSubject(nextSubject);

          const nextLines = Array.isArray(result.lines) ? result.lines : [];
          if (nextLines.length === 6 && nextLines.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)) {
            setLines(nextLines as LineType[]);
          }

          const nextMonth = typeof result.monthBranch === "string" ? result.monthBranch.trim() : "";
          const nextDay = typeof result.dayBranch === "string" ? result.dayBranch.trim() : "";
          setOverrideMonthBranch(nextMonth || null);
          setOverrideDayBranch(nextDay || null);

          window.setTimeout(() => {
            scrollAndFlash(subjectInputRef.current);
            scrollAndFlash(monthDayRef.current);
            scrollAndFlash(linesSectionRef.current);
          }, 0);
        }}
      />
      <div className="space-y-8">
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2 group">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                咨询主题
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="如：问来年财运..."
                ref={subjectInputRef}
                className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                关联缘主（可选）
              </label>
              <Select
                value={customerId}
                onValueChange={(v) => setCustomerId(String(v))}
                emptyLabel="-- 不绑定 --"
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <ChineseDatePicker label="起卦日期" value={dateIso} onChange={setDateIso} />
            <ChineseTimePicker label="起卦时间" value={timeHHmm} onChange={setTimeHHmm} />
          </div>

          <div ref={monthDayRef} className="grid grid-cols-2 gap-4">
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

        <section
          ref={linesSectionRef}
          className="bg-[#FAF7F2]/40 p-6 border border-[#B37D56]/10 rounded-none"
        >
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
                  {LINE_LABELS[idx] ?? `爻${idx + 1}`}
                </span>
                <div className="flex justify-center min-w-0">
                  <LiuyaoLineSvg
                    line={line}
                    className="h-6 w-full max-w-[160px]"
                    lineColor="#2F2F2F"
                    markColor="#A62121"
                  />
                </div>
                <Select
                  aria-label={`第 ${idx + 1} 爻`}
                  value={line}
                  onValueChange={(v) => setLineAtIndex(idx, v as LineType)}
                  options={LINE_OPTIONS}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
