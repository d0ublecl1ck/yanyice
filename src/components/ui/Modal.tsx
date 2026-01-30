"use client";

import React, { useEffect, useId, useMemo } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClassName: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  title,
  titleIcon,
  children,
  footer,
  onClose,
  size = "md",
  maxHeightClassName,
  scrollBody = false,
  hideScrollbar = false,
  showCloseButton = true,
  bodyClassName,
}: {
  open: boolean;
  title: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: ModalSize;
  maxHeightClassName?: string;
  scrollBody?: boolean;
  hideScrollbar?: boolean;
  showCloseButton?: boolean;
  bodyClassName?: string;
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

  const containerMaxHeight = maxHeightClassName ?? (scrollBody ? "max-h-[90vh]" : "");
  const bodyScrollClassName = scrollBody ? "min-h-0 flex-1 overflow-y-auto" : "";
  const scrollbarClassName = hideScrollbar
    ? "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    : "";

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white w-full ${sizeClassName[size]} ${containerMaxHeight} rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col`}
      >
        <div className="p-6 border-b border-[#B37D56]/10 flex justify-between items-center">
          <p
            id={titleId}
            className={`text-xs font-bold tracking-widest chinese-font text-[#2F2F2F] ${
              titleIcon ? "flex items-center gap-2" : ""
            }`}
          >
            {titleIcon}
            {title}
          </p>
          {showCloseButton ? (
            <button
              type="button"
              aria-label="关闭"
              className="text-[#2F2F2F]/20 hover:text-[#A62121] transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          ) : null}
        </div>

        <div className={`${bodyScrollClassName} ${scrollbarClassName} ${bodyClassName ?? "p-6"}`}>
          {children}
        </div>

        {footer ? <div className="p-6 border-t border-[#B37D56]/10">{footer}</div> : null}
      </div>
    </div>,
    portalTarget,
  );
}

export function ModalSecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 border border-[#B37D56]/20 text-[#2F2F2F] text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-[#FAF7F2] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function ModalPrimaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 bg-[#A62121] text-white text-[10px] font-bold tracking-widest uppercase rounded-[2px] hover:bg-[#8B1A1A] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
