import type { ConsultationRecord, LiuYaoData } from "@/lib/types";
import { apiFetch } from "@/lib/apiClient";

export type LiuyaoRecordPayload = {
  customerId?: string | null;
  customerName?: string | null;
  subject: string;
  notes: string;
  tags?: string[];
  liuyaoData: LiuYaoData;
  verifiedStatus?: ConsultationRecord["verifiedStatus"];
  verifiedNotes?: string;
};

type LiuyaoRecordDto = {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  module: "liuyao";
  subject: string;
  notes: string;
  tags: string[];
  liuyaoData: LiuYaoData;
  verifiedStatus: ConsultationRecord["verifiedStatus"];
  verifiedNotes: string;
  createdAt: number;
};

function toRecord(dto: LiuyaoRecordDto): ConsultationRecord {
  return {
    id: dto.id,
    customerId: dto.customerId ?? "",
    customerName: dto.customerName ?? undefined,
    module: "liuyao",
    subject: dto.subject,
    notes: dto.notes,
    tags: dto.tags,
    liuyaoData: dto.liuyaoData,
    verifiedStatus: dto.verifiedStatus,
    verifiedNotes: dto.verifiedNotes,
    createdAt: dto.createdAt,
  };
}

export async function listLiuyaoRecords(accessToken: string): Promise<ConsultationRecord[]> {
  const { records } = await apiFetch<{ records: LiuyaoRecordDto[] }>("/api/liuyao/records", {
    method: "GET",
    accessToken,
  });
  return records.map(toRecord);
}

export async function createLiuyaoRecord(
  accessToken: string,
  payload: LiuyaoRecordPayload,
): Promise<ConsultationRecord> {
  const { record } = await apiFetch<{ record: LiuyaoRecordDto }>("/api/liuyao/records", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
  return toRecord(record);
}

export async function updateLiuyaoRecord(
  accessToken: string,
  id: string,
  payload: Partial<LiuyaoRecordPayload>,
): Promise<ConsultationRecord> {
  const { record } = await apiFetch<{ record: LiuyaoRecordDto }>(`/api/liuyao/records/${encodeURIComponent(id)}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
  return toRecord(record);
}

export async function deleteLiuyaoRecord(accessToken: string, id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/liuyao/records/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}

