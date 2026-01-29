import { Type } from "@sinclair/typebox";

export const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_INPUT";

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function toJsonString(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export type UiModuleType = "liuyao" | "bazi";
export type UiVerifiedStatus = "unverified" | "accurate" | "inaccurate" | "partial";
export type UiCustomerGender = "male" | "female" | "other";

export function moduleToDb(module: UiModuleType) {
  return module === "bazi" ? "BAZI" : "LIUYAO";
}

export function moduleFromDb(module: "BAZI" | "LIUYAO"): UiModuleType {
  return module === "BAZI" ? "bazi" : "liuyao";
}

export function verifiedToDb(status: UiVerifiedStatus) {
  switch (status) {
    case "accurate":
      return "ACCURATE";
    case "inaccurate":
      return "INACCURATE";
    case "partial":
      return "PARTIAL";
    default:
      return "UNVERIFIED";
  }
}

export function verifiedFromDb(status: "UNVERIFIED" | "ACCURATE" | "INACCURATE" | "PARTIAL"): UiVerifiedStatus {
  switch (status) {
    case "ACCURATE":
      return "accurate";
    case "INACCURATE":
      return "inaccurate";
    case "PARTIAL":
      return "partial";
    default:
      return "unverified";
  }
}

export function genderToDb(gender: UiCustomerGender) {
  switch (gender) {
    case "female":
      return "FEMALE";
    case "other":
      return "OTHER";
    default:
      return "MALE";
  }
}

export function genderFromDb(gender: "MALE" | "FEMALE" | "OTHER"): UiCustomerGender {
  switch (gender) {
    case "FEMALE":
      return "female";
    case "OTHER":
      return "other";
    default:
      return "male";
  }
}

