import { SolarTime } from "tyme4ts";

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

const lunarMonthNameFromNumber = (month: number) => {
  if (month === 1) return "正月";
  if (month === 11) return "冬月";
  if (month === 12) return "腊月";
  const map = ["", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (month >= 2 && month <= 10) return `${map[month]}月`;
  return `${month}月`;
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

export const deriveBaziPickerFromNow = (now: Date): BaziPickerDerived => {
  const solar = {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
    h: now.getHours(),
    min: now.getMinutes(),
  };
  const solarTime = SolarTime.fromYmdHms(solar.y, solar.m, solar.d, solar.h, solar.min, 0);
  return deriveBaziPickerFromSolarTime(solarTime);
};

export type NowButtonResult = {
  derived: BaziPickerDerived;
  shouldAutoConfirm: false;
  shouldAutoClose: false;
};

export const getNowButtonResult = (now: Date): NowButtonResult => {
  return { derived: deriveBaziPickerFromNow(now), shouldAutoConfirm: false, shouldAutoClose: false };
};
