import { LunarDay, SolarTime } from "tyme4ts";

import { BRANCHES, STEMS } from "@/lib/constants";

export const BAZI_PICKER_YEAR_START = 1900;
export const BAZI_PICKER_YEAR_END = 2099;

export const getBaziPickerYearItems = () => {
  return Array.from(
    { length: BAZI_PICKER_YEAR_END - BAZI_PICKER_YEAR_START + 1 },
    (_, i) => BAZI_PICKER_YEAR_START + i,
  );
};

export type BaziPickerSolar = {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
};

export type BaziPickerLunar = {
  y: number;
  m: string;
  d: string;
  h: number;
  min: number;
};

export type BaziPickerFourPillars = {
  yS: string;
  yB: string;
  mS: string;
  mB: string;
  dS: string;
  dB: string;
  hS: string;
  hB: string;
};

export type BaziPickerDerived = {
  solar: BaziPickerSolar;
  lunar: BaziPickerLunar;
  fourPillars: BaziPickerFourPillars;
};

const LUNAR_DAY_NAMES = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
] as const;

const lunarMonthNameFromNumber = (month: number) => {
  if (month === 1) return "正月";
  if (month === 11) return "冬月";
  if (month === 12) return "腊月";
  const map = ["", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (month >= 2 && month <= 10) return `${map[month]}月`;
  return `${month}月`;
};

const lunarMonthNumberFromName = (name: string) => {
  const raw = name.trim();
  const isLeap = raw.startsWith("闰");
  const normalized = isLeap ? raw.slice(1) : raw;
  const monthName = normalized.endsWith("月") ? normalized : `${normalized}月`;
  const map: Record<string, number> = {
    正月: 1,
    二月: 2,
    三月: 3,
    四月: 4,
    五月: 5,
    六月: 6,
    七月: 7,
    八月: 8,
    九月: 9,
    十月: 10,
    冬月: 11,
    腊月: 12,
    十一月: 11,
    十二月: 12,
  };
  const month = map[monthName];
  if (!month) return null;
  return isLeap ? -month : month;
};

const lunarDayNumberFromName = (name: string) => {
  const idx = (LUNAR_DAY_NAMES as readonly string[]).indexOf(name.trim());
  if (idx < 0) return null;
  return idx + 1;
};

export const deriveBaziPickerFromSolarTime = (solarTime: SolarTime): BaziPickerDerived => {
  const sd = solarTime.getSolarDay();
  const ymd = sd.toString().match(/(\d+)年(\d+)月(\d+)日/);
  const time = solarTime.toString().match(/(\d+):(\d+):(\d+)/);
  const solar = {
    y: ymd ? Number(ymd[1]) : new Date().getFullYear(),
    m: ymd ? Number(ymd[2]) : 1,
    d: ymd ? Number(ymd[3]) : 1,
    h: time ? Number(time[1]) : 0,
    min: time ? Number(time[2]) : 0,
  };

  const lunarDay = sd.getLunarDay();
  const lunarMonth = lunarDay.getLunarMonth();
  const lunar = {
    y: lunarMonth.getYear(),
    m: lunarMonthNameFromNumber(lunarMonth.getMonth()),
    d: lunarDay.getName(),
    h: solar.h,
    min: solar.min,
  };

  const eightChar = solarTime.getLunarHour().getEightChar();
  const fourPillars = {
    yS: eightChar.getYear().getHeavenStem().getName(),
    yB: eightChar.getYear().getEarthBranch().getName(),
    mS: eightChar.getMonth().getHeavenStem().getName(),
    mB: eightChar.getMonth().getEarthBranch().getName(),
    dS: eightChar.getDay().getHeavenStem().getName(),
    dB: eightChar.getDay().getEarthBranch().getName(),
    hS: eightChar.getHour().getHeavenStem().getName(),
    hB: eightChar.getHour().getEarthBranch().getName(),
  };

  return { solar, lunar, fourPillars };
};

export const deriveBaziPickerFromSolar = (solar: BaziPickerSolar): BaziPickerDerived => {
  const solarTime = SolarTime.fromYmdHms(solar.y, solar.m, solar.d, solar.h, solar.min, 0);
  return deriveBaziPickerFromSolarTime(solarTime);
};

export const deriveBaziPickerFromNow = (now: Date): BaziPickerDerived => {
  const solar = {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
    h: now.getHours(),
    min: now.getMinutes(),
  };
  return deriveBaziPickerFromSolar(solar);
};

export type NowButtonResult = {
  derived: BaziPickerDerived;
  shouldAutoConfirm: false;
  shouldAutoClose: false;
};

export const getNowButtonResult = (now: Date): NowButtonResult => {
  return { derived: deriveBaziPickerFromNow(now), shouldAutoConfirm: false, shouldAutoClose: false };
};

export type BaziTimePickerOpenDefaults = {
  tab: "solar";
  derived: BaziPickerDerived;
};

export const getBaziTimePickerOpenDefaults = (now: Date): BaziTimePickerOpenDefaults => {
  return { tab: "solar", derived: deriveBaziPickerFromNow(now) };
};

export const tryDeriveSolarFromLunar = (lunar: BaziPickerLunar): BaziPickerSolar | null => {
  const month = lunarMonthNumberFromName(lunar.m);
  const day = lunarDayNumberFromName(lunar.d);
  if (!month || !day) return null;
  try {
    const lunarDay = LunarDay.fromYmd(lunar.y, month, day);
    const solarDay = lunarDay.getSolarDay();
    return { y: solarDay.getYear(), m: solarDay.getMonth(), d: solarDay.getDay(), h: lunar.h, min: lunar.min };
  } catch {
    return null;
  }
};

export const parseQuickSolarInput = (input: string): BaziPickerSolar | null => {
  const digits = input.replace(/\D/g, "");
  if (![8, 10, 12].includes(digits.length)) return null;

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));
  const h = digits.length >= 10 ? Number(digits.slice(8, 10)) : 0;
  const min = digits.length === 12 ? Number(digits.slice(10, 12)) : 0;

  if (!Number.isFinite(y) || y < BAZI_PICKER_YEAR_START || y > BAZI_PICKER_YEAR_END) return null;
  if (!Number.isFinite(m) || m < 1 || m > 12) return null;
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  if (!Number.isFinite(min) || min < 0 || min > 59) return null;

  const maxDay = new Date(y, m, 0).getDate();
  if (!Number.isFinite(d) || d < 1 || d > maxDay) return null;

  return { y, m, d, h, min };
};

export const parseQuickFourPillarsInput = (input: string): BaziPickerFourPillars | null => {
  const cleaned = input
    .trim()
    .replace(/\s+/g, "")
    .replace(/[年月日时柱、，,;:：\-\|/]/g, "");

  const chars = Array.from(cleaned);
  if (chars.length !== 8) return null;

  for (let i = 0; i < chars.length; i += 2) {
    const stem = chars[i];
    const branch = chars[i + 1];
    if (!stem || !branch) return null;
    if (!(STEMS as readonly string[]).includes(stem)) return null;
    if (!(BRANCHES as readonly string[]).includes(branch)) return null;
  }

  return {
    yS: chars[0],
    yB: chars[1],
    mS: chars[2],
    mB: chars[3],
    dS: chars[4],
    dB: chars[5],
    hS: chars[6],
    hB: chars[7],
  };
};
