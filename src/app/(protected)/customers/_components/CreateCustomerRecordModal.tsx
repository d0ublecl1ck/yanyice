"use client";

import React from "react";
import { Modal, ModalPrimaryButton } from "@/components/ui/Modal";

import type { CustomerGender } from "@/lib/types";

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
  return (
    <Modal
      open={open}
      title="登记新客户"
      onClose={onClose}
      size="md"
      showCloseButton
      bodyClassName="p-6 space-y-5"
    >
      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          姓名（必填）
        </label>
        <input
          ref={nameInputRef}
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="请输入客户姓名"
          className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px] outline-none focus:border-[#A62121] transition-colors chinese-font"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          性别（必填）
        </label>
        <div className="flex gap-3">
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
