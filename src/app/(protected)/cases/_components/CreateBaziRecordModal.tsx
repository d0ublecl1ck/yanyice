"use client";

import React, { useState } from "react";
import { Hash, Sparkles } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { AiRecognitionModal } from "@/components/ai/AiRecognitionModal";
import type { AiRecognizeBaziResult } from "@/lib/aiRecognition";
import { useAiConfigStore } from "@/stores/useAiConfigStore";
import { useToastStore } from "@/stores/useToastStore";
import { BaziEditView } from "../../bazi/_components/BaziEditView";

export function CreateBaziRecordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const aiModel = useAiConfigStore((s) => s.model);
  const toast = useToastStore();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrefill, setAiPrefill] = useState<(AiRecognizeBaziResult & { _nonce: number }) | null>(null);

  return (
    <Modal
      open={open}
      title="新建八字"
      titleIcon={<Hash size={16} />}
      onClose={onClose}
      size="md"
      scrollBody
      hideScrollbar
      maxHeightClassName="max-h-[90vh]"
      bodyClassName="p-6"
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
        target="bazi"
        onClose={() => setAiOpen(false)}
        onRecognized={(result) => {
          setAiPrefill({ ...result, _nonce: Date.now() });
        }}
      />
      <BaziEditView embedded aiPrefill={aiPrefill} />
    </Modal>
  );
}
