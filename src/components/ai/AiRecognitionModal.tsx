"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, UploadCloud, X } from "lucide-react";

import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  AiRecognizeBaziResult,
  AiRecognizeCustomerResult,
  AiRecognizeLiuyaoResult,
  AiRecognizeTarget,
} from "@/lib/aiRecognition";

type Props<T extends AiRecognizeTarget> = {
  open: boolean;
  target: T;
  onClose: () => void;
  onRecognized: (
    result: T extends "bazi"
      ? AiRecognizeBaziResult
      : T extends "liuyao"
        ? AiRecognizeLiuyaoResult
        : AiRecognizeCustomerResult,
  ) => void;
};

const PAPER_TEXTURE_URL = "https://www.transparenttextures.com/patterns/natural-paper.png";

const placeholderByTarget: Record<AiRecognizeTarget, string> = {
  bazi: "例如：1995年8月10日10点出生在北京，或粘贴一段命理描述...",
  liuyao: "例如：问来年财运，起卦时间 2025-01-01 10:30，或粘贴一段卦例描述...",
  customer: "例如：张三，男，电话 138xxxxxx，或粘贴一段客户描述...",
};

export function AiRecognitionModal<T extends AiRecognizeTarget>({
  open,
  target,
  onClose,
  onRecognized,
}: Props<T>) {
  const toast = useToastStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText("");
    setImageFile(null);
    setIsLoading(false);
  }, [open]);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const readFileAsBase64 = (file: File) =>
    new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read-failed"));
      reader.onload = () => {
        const result = String(reader.result || "");
        const [, base64] = result.split(",", 2);
        if (!base64) {
          reject(new Error("invalid-base64"));
          return;
        }
        resolve({ data: base64, mimeType: file.type || "image/png" });
      };
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    if (!open) return;

    const onPaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const dt = e.clipboardData;
      if (!dt) return;

      const items = Array.from(dt.items ?? []);
      const imageItem = items.find((it) => it.kind === "file" && it.type.startsWith("image/"));
      const blob = imageItem?.getAsFile?.() ?? null;
      if (!blob) return;

      const file = new File([blob], `clipboard-${Date.now()}.${blob.type.split("/")[1] || "png"}`, {
        type: blob.type || "image/png",
      });
      setImageFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.show("已从剪贴板粘贴图片", "success");

      // Prevent clipboard image payload from being pasted as text into focused fields.
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("paste", onPaste, true);
    return () => document.removeEventListener("paste", onPaste, true);
  }, [isLoading, open, toast]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="AI 智能识盘"
      titleIcon={<Sparkles size={16} className="text-[#A62121]" />}
      onClose={() => {
        if (isLoading) return;
        onClose();
      }}
      size="sm"
      bodyClassName="p-6 space-y-5"
      containerClassName="bg-[var(--paper-bg)] border-[0.5px] border-[#B37D56]/30"
      containerStyle={{ backgroundImage: `url("${PAPER_TEXTURE_URL}")` }}
      footer={
        <div className="space-y-3">
          <div className="flex gap-3">
            <ModalSecondaryButton disabled={isLoading} onClick={onClose} className="flex-1">
              取消
            </ModalSecondaryButton>
            <ModalPrimaryButton
              disabled={isLoading}
              onClick={() => {
                void (async () => {
                  if (!accessToken) {
                    toast.show("未登录或登录已过期", "error");
                    return;
                  }
                  const trimmedText = text.trim();
                  if (!trimmedText && !imageFile) {
                    toast.show("请至少提供文字或图片", "warning");
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const image = imageFile ? await readFileAsBase64(imageFile) : undefined;
                    const json = await apiFetch<unknown>("/api/ai/recognize", {
                      method: "POST",
                      accessToken,
                      body: JSON.stringify({
                        target,
                        text: trimmedText || undefined,
                        image,
                      }),
                    });
                    onRecognized(json as never);
                    toast.show("识别成功，已自动填充表单", "success");
                    onClose();
                  } catch {
                    toast.show("识别失败，请稍后重试", "error");
                  } finally {
                    setIsLoading(false);
                  }
                })();
              }}
              className="flex-1 h-12 chinese-font tracking-[0.4em]"
            >
              {isLoading ? "识别中..." : "开始智能识别"}
            </ModalPrimaryButton>
          </div>
          {/* footer note removed */}
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          <span>文字描述</span>
        </div>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderByTarget[target]}
          className="w-full bg-white/60 p-4 border border-[#B37D56]/10 text-xs outline-none focus:border-[#A62121] transition-colors rounded-[4px]"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#B37D56]/10" />
        <div className="text-[10px] text-[#2F2F2F]/30 chinese-font">或者</div>
        <div className="flex-1 h-px bg-[#B37D56]/10" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          <span>截图识别</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setImageFile(f);
          }}
        />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-dashed border-[#B37D56]/20 bg-white/50 rounded-[4px] h-[180px] flex items-center justify-center text-center hover:border-[#A62121]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {imagePreviewUrl ? (
            <div className="w-full h-full p-3 relative">
              <div className="relative w-full h-full rounded-[4px] border border-[#B37D56]/10 overflow-hidden">
                <Image
                  src={imagePreviewUrl}
                  alt="上传预览"
                  fill
                  unoptimized
                  sizes="360px"
                  className="object-contain"
                />
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-[#2F2F2F]/40 font-bold bg-[var(--paper-bg)] border border-[#B37D56]/10 px-2 py-1 rounded-[2px]">
                  已选择
                </span>
                <button
                  type="button"
                  aria-label="移除图片"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-2 bg-[var(--paper-bg)] border border-[#B37D56]/10 text-[#2F2F2F]/50 hover:text-[#A62121] transition-colors rounded-[2px]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-6">
              <div className="mx-auto w-10 h-10 border border-[#B37D56]/10 bg-[var(--paper-bg)] rounded-[4px] flex items-center justify-center text-[#B37D56]/60">
                <UploadCloud size={18} />
              </div>
              <div className="text-[10px] text-[#2F2F2F]/30 chinese-font">
                点击上传图片（支持截图 / 照片）
              </div>
            </div>
          )}
        </button>
      </div>
    </Modal>
  );
}
