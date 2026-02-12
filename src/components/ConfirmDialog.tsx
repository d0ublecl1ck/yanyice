"use client";

import React from "react";

import { Modal } from "@/components/ui/Modal";

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
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-[#B37D56]/20 text-[#2F2F2F] text-xs font-bold tracking-widest hover:bg-[#FAF7F2] transition-all rounded-[2px] chinese-font"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-[#A62121] text-white text-xs font-bold tracking-widest hover:bg-[#8B1A1A] transition-colors rounded-[2px] chinese-font"
          >
            {confirmText}
          </button>
        </div>
      }
    >
      {description ? <p className="text-xs text-[#2F2F2F]/60 chinese-font">{description}</p> : null}
    </Modal>
  );
}
