"use client";

import React from "react";
import { Hash } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { BaziEditView } from "../../bazi/_components/BaziEditView";

export function EditBaziRecordModal({
  open,
  id,
  onClose,
}: {
  open: boolean;
  id: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title="编辑八字"
      titleIcon={<Hash size={16} />}
      onClose={onClose}
      size="md"
      scrollBody
      hideScrollbar
      maxHeightClassName="max-h-[90vh]"
      bodyClassName="p-6"
    >
      <BaziEditView id={id} embedded />
    </Modal>
  );
}

