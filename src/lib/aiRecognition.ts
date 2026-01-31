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
  subject: string;
  lines?: number[];
  iso?: string;
  solar?: { y: number; m: number; d: number; h: number; min: number };
  fourPillars?: string;
};

export type AiRecognizeCustomerResult = {
  name?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  tags?: string[];
  notes?: string;
};
