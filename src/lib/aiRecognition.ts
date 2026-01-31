export type AiRecognizeTarget = "bazi" | "liuyao" | "customer";

export type AiRecognizeBaziResult = {
  name?: string;
  gender?: "male" | "female" | "other";
  location?: string;
  solar?: { y: number; m: number; d: number; h: number; min: number };
  fourPillars?: {
    yearStem?: string;
    yearBranch?: string;
    monthStem?: string;
    monthBranch?: string;
    dayStem?: string;
    dayBranch?: string;
    hourStem?: string;
    hourBranch?: string;
  };
};

export type AiRecognizeLiuyaoResult = {
  // Legacy fields (kept for backward compatibility)
  subject?: string;
  lines?: number[];
  iso?: string;
  solar?: { y: number; m: number; d: number; h: number; min: number };
  baseHexagramName?: string;
  changedHexagramName?: string;
  fourPillars?: string;

  // New incremental extraction fields (preferred)
  time?: {
    gregorian?: { date?: string; time?: string; timezone?: string; confidence?: number };
    ganzhi?: { year?: string; month?: string; day?: string; hour?: string; confidence?: number };
  };
  pan?: {
    lines?: string[];
    hexagram?: { original?: string; changed?: string };
  };
  topic?: string;
  gender?: "男" | "女" | "不详";
  tags?: string[];
};

export type AiRecognizeCustomerResult = {
  name?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  tags?: string[];
  notes?: string;
};
