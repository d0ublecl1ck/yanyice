"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal, ModalPrimaryButton } from "@/components/ui/Modal";
import { AiRecognitionModal } from "@/components/ai/AiRecognitionModal";

import type { CustomerGender } from "@/lib/types";
import { scrollAndFlash } from "@/lib/scrollFlash";
import { useAiConfigStore } from "@/stores/useAiConfigStore";
import { useToastStore } from "@/stores/useToastStore";

export function CreateCustomerRecordModal({
  open,
  onClose,
  nameInputRef,
  createName,
  setCreateName,
  createGender,
  setCreateGender,
  createPhone,
  setCreatePhone,
  createNotes,
  setCreateNotes,
  createTags,
  setCreateTags,
  createNewTag,
  setCreateNewTag,
  isCreating,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  createName: string;
  setCreateName: (next: string) => void;
  createGender: CustomerGender;
  setCreateGender: (next: CustomerGender) => void;
  createPhone: string;
  setCreatePhone: (next: string) => void;
  createNotes: string;
  setCreateNotes: (next: string) => void;
  createTags: string[];
  setCreateTags: (next: string[]) => void;
  createNewTag: string;
  setCreateNewTag: (next: string) => void;
  isCreating: boolean;
  onSubmit: () => void;
}) {
  const aiModel = useAiConfigStore((s) => s.model);
  const toast = useToastStore();
  const [aiOpen, setAiOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setAiOpen(false);
  }, [open]);

  return (
    <Modal
      open={open}
      title="登记新缘主"
      onClose={onClose}
      size="md"
      showCloseButton
      bodyClassName="p-6 space-y-5"
      headerActions={
        <button
          type="button"
          aria-label="AI 智能识盘"
          title="AI 智能识盘"
          onClick={() => {
            if (!aiModel.trim()) {
              toast.show("请先在设置中配置模型", "warning");
              return;
            }
            setAiOpen(true);
          }}
          className="p-2 text-[#B37D56]/60 hover:text-[#A62121] hover:bg-[#A62121]/5 transition-all rounded-[2px]"
        >
          <Sparkles size={18} />
        </button>
      }
    >
      <AiRecognitionModal
        open={aiOpen}
        target="customer"
        onClose={() => setAiOpen(false)}
        onRecognized={(result) => {
          const nextName = typeof result.name === "string" ? result.name.trim() : "";
          if (nextName) setCreateName(nextName);

          const nextGender = result.gender;
          if (nextGender === "male" || nextGender === "female" || nextGender === "other") {
            setCreateGender(nextGender);
          }

          const nextPhone = typeof result.phone === "string" ? result.phone.trim() : "";
          if (nextPhone) setCreatePhone(nextPhone);

          const nextNotes = typeof result.notes === "string" ? result.notes : "";
          if (nextNotes) setCreateNotes(nextNotes);

          const nextTags = Array.isArray(result.tags) ? result.tags : [];
          if (nextTags.length > 0) {
            const normalized = nextTags
              .map((t) => String(t).trim())
              .filter(Boolean)
              .slice(0, 50);
            setCreateTags(Array.from(new Set(normalized)));
          }

          window.setTimeout(() => {
            scrollAndFlash(nameInputRef.current);
            scrollAndFlash(genderRef.current);
            scrollAndFlash(phoneRef.current);
            scrollAndFlash(notesRef.current);
          }, 0);
          return true;
        }}
      />
      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          姓名（必填）
        </label>
        <input
          ref={nameInputRef}
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="请输入缘主姓名"
          className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px] outline-none focus:border-[#A62121] transition-colors chinese-font"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          性别（必填）
        </label>
        <div ref={genderRef} className="flex gap-3">
          {(
            [
              { id: "male", label: "男" },
              { id: "female", label: "女" },
              { id: "other", label: "不详" },
            ] as const
          ).map((g) => (
            <button
              key={g.id}
              onClick={() => setCreateGender(g.id)}
              className={`px-4 py-2 text-xs border font-bold transition-all rounded-[2px] ${
                createGender === g.id
                  ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                  : "border-[#B37D56]/20 text-[#2F2F2F]/50 hover:border-[#A62121]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          联系方式（可选）
        </label>
        <input
          ref={phoneRef}
          value={createPhone}
          onChange={(e) => setCreatePhone(e.target.value)}
          placeholder="手机号 / 微信 / 其他"
          className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs rounded-[2px] outline-none focus:border-[#A62121] transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          标签（可选）
        </label>
        {createTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {createTags.map((t) => (
              <span
                key={t}
                className="text-[10px] bg-[#FAF7F2] text-[#2F2F2F] px-2 py-1 border border-[#B37D56]/10 flex items-center gap-1"
              >
                {t}{" "}
                <button
                  onClick={() => setCreateTags(createTags.filter((tag) => tag !== t))}
                  className="text-[#A62121] hover:font-bold"
                  aria-label={`移除标签 ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={createNewTag}
            onChange={(e) => setCreateNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const next = createNewTag.trim();
              if (!next || createTags.includes(next)) return;
              setCreateTags([...createTags, next]);
              setCreateNewTag("");
            }}
            placeholder="输入后回车添加"
            className="flex-1 bg-white border border-[#B37D56]/10 px-3 py-2 text-xs rounded-[2px] outline-none focus:border-[#A62121] transition-colors"
          />
          <button
            onClick={() => {
              const next = createNewTag.trim();
              if (!next || createTags.includes(next)) return;
              setCreateTags([...createTags, next]);
              setCreateNewTag("");
            }}
            className="px-4 py-2 text-xs border border-[#B37D56]/20 text-[#B37D56] font-bold rounded-[2px] hover:bg-[#FAF7F2] transition-all"
          >
            添加
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          备注（可选）
        </label>
        <textarea
          ref={notesRef}
          rows={4}
          value={createNotes}
          onChange={(e) => setCreateNotes(e.target.value)}
          placeholder="补充说明..."
          className="w-full bg-[#FAF7F2]/50 p-4 border border-[#B37D56]/5 text-xs outline-none focus:border-[#A62121] italic rounded-[4px]"
        />
      </div>

      <ModalPrimaryButton
        disabled={isCreating}
        onClick={onSubmit}
        className="w-full h-12 chinese-font tracking-[0.4em] hover:bg-[#8B1A1A]"
      >
        {isCreating ? "创建中..." : "创建"}
      </ModalPrimaryButton>
    </Modal>
  );
}
