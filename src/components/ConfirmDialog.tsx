"use client";

import React, { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2F2F2F]/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white border border-[#B37D56]/20 shadow-[0_24px_64px_rgba(0,0,0,0.2)] rounded-none">
        <div className="p-6 border-b border-[#B37D56]/10">
          <h3 className="text-lg font-bold text-[#2F2F2F] chinese-font">{title}</h3>
          {description && (
            <p className="mt-2 text-xs text-[#2F2F2F]/60 chinese-font">{description}</p>
          )}
        </div>
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-[#B37D56]/20 text-[#2F2F2F] text-xs font-bold tracking-widest hover:bg-[#FAF7F2] transition-all rounded-none chinese-font"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-[#A62121] text-white text-xs font-bold tracking-widest hover:bg-[#8B1A1A] transition-colors rounded-none chinese-font"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
