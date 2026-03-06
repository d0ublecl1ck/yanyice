import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import type { ConsultationRecord, LiuYaoData } from "@/lib/types";

import { getPrismaClient } from "../../../../server/src/prismaSingleton";
import { verifyAccessToken } from "../../../../server/src/jwt";

const prisma = getPrismaClient();

type ErrorBody = { code: string; message: string };
type VerifiedStatus = ConsultationRecord["verifiedStatus"];
type LiuyaoRecordBody = {
  customerId?: string | null;
  customerName?: string | null;
  subject: string;
  notes: string;
  tags?: string[];
  liuyaoData: LiuYaoData;
  verifiedStatus?: VerifiedStatus;
  verifiedNotes?: string;
};
type LiuyaoRecordUpdateBody = Partial<LiuyaoRecordBody>;

export function jsonError(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function toRecordResponse(row: {
  id: string;
  customerId: string | null;
  customerName: string | null;
  subject: string;
  notes: string;
  tagsJson: string;
  liuyaoDataJson: string | null;
  verifiedStatus: VerifiedStatus;
  verifiedNotes: string;
  pinnedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    module: "liuyao" as const,
    subject: row.subject,
    notes: row.notes,
    tags: safeJsonParse<string[]>(row.tagsJson, []),
    liuyaoData: safeJsonParse<LiuYaoData>(row.liuyaoDataJson, {
      lines: [0, 0, 0, 0, 0, 0],
      date: "",
      subject: "",
      gender: "unknown",
      monthBranch: "",
      dayBranch: "",
    }),
    verifiedStatus: row.verifiedStatus,
    verifiedNotes: row.verifiedNotes,
    pinnedAt: row.pinnedAt ? row.pinnedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
  };
}

function readBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getAuthorizedUserId(req: Request) {
  const token = readBearerToken(req);
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true } });
  return user?.id ?? null;
}

function isValidLine(value: unknown): value is 0 | 1 | 2 | 3 {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

function isValidGender(value: unknown): value is "male" | "female" | "unknown" {
  return value === "male" || value === "female" || value === "unknown";
}

function isValidVerifiedStatus(value: unknown): value is VerifiedStatus {
  return value === "unverified" || value === "accurate" || value === "inaccurate" || value === "partial";
}

function normalizeTags(tags: unknown): string[] | null {
  if (tags === undefined) return [];
  if (!Array.isArray(tags) || tags.length > 50) return null;
  const normalized: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== "string") return null;
    const trimmed = tag.trim();
    if (!trimmed || trimmed.length > 50) return null;
    normalized.push(trimmed);
  }
  return normalized;
}

function normalizeLiuyaoData(input: unknown): LiuYaoData | null {
  if (!input || typeof input !== "object") return null;
  const lines = (input as { lines?: unknown }).lines;
  const date = (input as { date?: unknown }).date;
  const subject = (input as { subject?: unknown }).subject;
  const monthBranch = (input as { monthBranch?: unknown }).monthBranch;
  const dayBranch = (input as { dayBranch?: unknown }).dayBranch;
  const gender = (input as { gender?: unknown }).gender;

  if (!Array.isArray(lines) || lines.length !== 6 || !lines.every(isValidLine)) return null;
  if (typeof date !== "string" || typeof subject !== "string" || typeof monthBranch !== "string" || typeof dayBranch !== "string") {
    return null;
  }
  if (gender !== undefined && !isValidGender(gender)) return null;

  return {
    lines,
    date,
    subject,
    monthBranch,
    dayBranch,
    ...(gender ? { gender } : {}),
  };
}

export async function parseCreateBody(req: Request): Promise<LiuyaoRecordBody | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  const data = (await req.json().catch(() => null)) as unknown;
  if (!data || typeof data !== "object") return null;

  const subject = (data as { subject?: unknown }).subject;
  const notes = (data as { notes?: unknown }).notes;
  const verifiedNotes = (data as { verifiedNotes?: unknown }).verifiedNotes;
  const customerId = (data as { customerId?: unknown }).customerId;
  const customerName = (data as { customerName?: unknown }).customerName;
  const verifiedStatus = (data as { verifiedStatus?: unknown }).verifiedStatus;

  if (typeof subject !== "string" || typeof notes !== "string") return null;
  const normalizedSubject = subject.trim();
  if (!normalizedSubject || normalizedSubject.length > 200 || notes.length > 20_000) return null;
  if (customerId !== undefined && customerId !== null && typeof customerId !== "string") return null;
  if (customerName !== undefined && customerName !== null && typeof customerName !== "string") return null;
  if (verifiedNotes !== undefined && typeof verifiedNotes !== "string") return null;
  if (typeof verifiedNotes === "string" && verifiedNotes.length > 20_000) return null;
  if (verifiedStatus !== undefined && !isValidVerifiedStatus(verifiedStatus)) return null;

  const tags = normalizeTags((data as { tags?: unknown }).tags);
  const liuyaoData = normalizeLiuyaoData((data as { liuyaoData?: unknown }).liuyaoData);
  if (!tags || !liuyaoData) return null;

  return {
    customerId: customerId === undefined ? undefined : customerId,
    customerName: customerName === undefined ? undefined : customerName,
    subject: normalizedSubject,
    notes,
    tags,
    liuyaoData,
    verifiedStatus: verifiedStatus ?? "unverified",
    verifiedNotes: verifiedNotes ?? "",
  };
}

export async function parseUpdateBody(req: Request): Promise<LiuyaoRecordUpdateBody | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  const data = (await req.json().catch(() => null)) as unknown;
  if (!data || typeof data !== "object") return null;

  const updates: LiuyaoRecordUpdateBody = {};
  if ("customerId" in data) {
    const customerId = (data as { customerId?: unknown }).customerId;
    if (customerId !== null && typeof customerId !== "string") return null;
    updates.customerId = customerId ?? null;
  }
  if ("customerName" in data) {
    const customerName = (data as { customerName?: unknown }).customerName;
    if (customerName !== null && typeof customerName !== "string") return null;
    updates.customerName = customerName ?? null;
  }
  if ("subject" in data) {
    const subject = (data as { subject?: unknown }).subject;
    if (typeof subject !== "string") return null;
    const normalizedSubject = subject.trim();
    if (!normalizedSubject || normalizedSubject.length > 200) return null;
    updates.subject = normalizedSubject;
  }
  if ("notes" in data) {
    const notes = (data as { notes?: unknown }).notes;
    if (typeof notes !== "string" || notes.length > 20_000) return null;
    updates.notes = notes;
  }
  if ("tags" in data) {
    const tags = normalizeTags((data as { tags?: unknown }).tags);
    if (!tags) return null;
    updates.tags = tags;
  }
  if ("liuyaoData" in data) {
    const liuyaoData = normalizeLiuyaoData((data as { liuyaoData?: unknown }).liuyaoData);
    if (!liuyaoData) return null;
    updates.liuyaoData = liuyaoData;
  }
  if ("verifiedStatus" in data) {
    const verifiedStatus = (data as { verifiedStatus?: unknown }).verifiedStatus;
    if (!isValidVerifiedStatus(verifiedStatus)) return null;
    updates.verifiedStatus = verifiedStatus;
  }
  if ("verifiedNotes" in data) {
    const verifiedNotes = (data as { verifiedNotes?: unknown }).verifiedNotes;
    if (typeof verifiedNotes !== "string" || verifiedNotes.length > 20_000) return null;
    updates.verifiedNotes = verifiedNotes;
  }

  return updates;
}

export async function listLiuyaoRecordsForUser(userId: string) {
  const rows = await prisma.consultationRecord.findMany({
    where: { userId, module: "liuyao" },
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      customerId: true,
      customerName: true,
      subject: true,
      notes: true,
      tagsJson: true,
      liuyaoDataJson: true,
      verifiedStatus: true,
      verifiedNotes: true,
      pinnedAt: true,
      createdAt: true,
    },
  });
  return rows.map(toRecordResponse);
}

export async function createLiuyaoRecordForUser(userId: string, body: LiuyaoRecordBody) {
  const created = await prisma.consultationRecord.create({
    data: {
      userId,
      module: "liuyao",
      customerId: body.customerId ?? null,
      customerName: body.customerName ?? null,
      subject: body.subject,
      notes: body.notes,
      tagsJson: JSON.stringify(body.tags ?? []),
      liuyaoDataJson: JSON.stringify(body.liuyaoData),
      verifiedStatus: body.verifiedStatus ?? "unverified",
      verifiedNotes: body.verifiedNotes ?? "",
    },
    select: {
      id: true,
      customerId: true,
      customerName: true,
      subject: true,
      notes: true,
      tagsJson: true,
      liuyaoDataJson: true,
      verifiedStatus: true,
      verifiedNotes: true,
      pinnedAt: true,
      createdAt: true,
    },
  });
  return toRecordResponse(created);
}

export async function getLiuyaoRecordForUser(userId: string, id: string) {
  const row = await prisma.consultationRecord.findFirst({
    where: { id, userId, module: "liuyao" },
    select: {
      id: true,
      customerId: true,
      customerName: true,
      subject: true,
      notes: true,
      tagsJson: true,
      liuyaoDataJson: true,
      verifiedStatus: true,
      verifiedNotes: true,
      pinnedAt: true,
      createdAt: true,
    },
  });
  return row ? toRecordResponse(row) : null;
}

export async function updateLiuyaoRecordForUser(userId: string, id: string, updates: LiuyaoRecordUpdateBody) {
  const existing = await prisma.consultationRecord.findFirst({
    where: { id, userId, module: "liuyao" },
    select: { id: true },
  });
  if (!existing) return null;

  const data: Prisma.ConsultationRecordUpdateInput = {};
  if (updates.customerId !== undefined) data.customerId = updates.customerId;
  if (updates.customerName !== undefined) data.customerName = updates.customerName;
  if (updates.subject !== undefined) data.subject = updates.subject;
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.tags !== undefined) data.tagsJson = JSON.stringify(updates.tags);
  if (updates.liuyaoData !== undefined) data.liuyaoDataJson = JSON.stringify(updates.liuyaoData);
  if (updates.verifiedStatus !== undefined) data.verifiedStatus = updates.verifiedStatus;
  if (updates.verifiedNotes !== undefined) data.verifiedNotes = updates.verifiedNotes;

  const saved = await prisma.consultationRecord.update({
    where: { id },
    data,
    select: {
      id: true,
      customerId: true,
      customerName: true,
      subject: true,
      notes: true,
      tagsJson: true,
      liuyaoDataJson: true,
      verifiedStatus: true,
      verifiedNotes: true,
      pinnedAt: true,
      createdAt: true,
    },
  });
  return toRecordResponse(saved);
}

export async function deleteLiuyaoRecordForUser(userId: string, id: string) {
  const existing = await prisma.consultationRecord.findFirst({
    where: { id, userId, module: "liuyao" },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.consultationRecord.delete({ where: { id } });
  return true;
}
