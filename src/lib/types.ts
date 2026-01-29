
export type ModuleType = "liuyao" | "bazi";

export enum LineType {
  SHAO_YANG = 0, // 少阳 —
  SHAO_YIN = 1,  // 少阴 --
  LAO_YANG = 2,  // 老阳 — O (动)
  LAO_YIN = 3    // 老阴 -- X (动)
}

export interface LiuYaoData {
  lines: LineType[]; // 从下往上 0-5
  date: string; // 农历或公历日期
  subject: string; // 问事主题
  monthBranch: string; // 月建
  dayBranch: string; // 日辰
}

export interface BaZiData {
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string;
  hourBranch: string;
  isLunar: boolean;
  birthDate: string;
}

export interface Customer {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: string;
  birthTime?: string; // 精确时间点
  phone?: string;
  tags: string[];
  notes: string;
  customFields: Record<string, string>;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  customerId: string;
  time: string;
  description: string;
  tags: string[];
}

export interface ConsultationRecord {
  id: string;
  customerId: string;
  module: ModuleType;
  subject: string;
  notes: string;
  tags: string[];
  liuyaoData?: LiuYaoData;
  baziData?: BaZiData;
  verifiedStatus: 'unverified' | 'accurate' | 'inaccurate' | 'partial';
  verifiedNotes: string;
  createdAt: number;
}

export interface Rule {
  id: string;
  module: ModuleType;
  name: string;
  enabled: boolean;
  condition: string; // 自然语言或简单逻辑描述
  message: string;
}

export interface User {
  username: string;
}
