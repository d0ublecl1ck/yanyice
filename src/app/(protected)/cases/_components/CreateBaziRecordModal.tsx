"use client";

import React from "react";
import { Hash, X } from "lucide-react";

import { BaziEditView } from "../../bazi/_components/BaziEditView";

export function CreateBaziRecordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="新建八字"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-6 border-b border-[#B37D56]/10 flex justify-between items-center">
          <p className="text-xs font-bold tracking-widest chinese-font text-[#2F2F2F] flex items-center gap-2">
            <Hash size={16} />
            新建八字
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[#2F2F2F]/20 hover:text-[#A62121] transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <BaziEditView embedded />
        </div>
      </div>
    </div>
  );
}

