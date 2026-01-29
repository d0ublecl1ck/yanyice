"use client";

import React, { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg";

const sizeClassName: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: ModalSize;
}) {
  const titleId = useId();

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭弹窗"
        className="absolute inset-0 bg-[#2F2F2F]/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${sizeClassName[size]} bg-white border border-[#B37D56]/20 rounded-[4px]`}
      >
        <div className="px-6 py-5 border-b border-[#B37D56]/10">
          <h3 id={titleId} className="text-lg font-bold text-[#2F2F2F] chinese-font">
            {title}
          </h3>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? <div className="px-6 py-5 border-t border-[#B37D56]/10">{footer}</div> : null}
      </div>
    </div>,
    portalTarget,
  );
}

