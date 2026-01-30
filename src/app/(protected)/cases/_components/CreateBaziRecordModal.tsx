"use client";

import React from "react";
import { Hash } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { BaziEditView } from "../../bazi/_components/BaziEditView";

export function CreateBaziRecordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    >
      <BaziEditView embedded />
    </Modal>
  );
}
