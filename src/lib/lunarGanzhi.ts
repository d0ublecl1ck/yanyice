import { SolarTime } from "tyme4ts";

export const formatGanzhiYearMonth = (date: Date) => {
  const solarTime = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );

  const eightChar = solarTime.getLunarHour().getEightChar();
  const year = eightChar.getYear();
  const month = eightChar.getMonth();

  const yearText = `${year.getHeavenStem().getName()}${year.getEarthBranch().getName()}年`;
  const monthText = `${month.getHeavenStem().getName()}${month.getEarthBranch().getName()}月`;
  return `${yearText} ${monthText}`;
};

export function getGanzhiDay(date: Date): { stem: string; branch: string; text: string } {
  const solarTime = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );

  const eightChar = solarTime.getLunarHour().getEightChar();
  const day = eightChar.getDay();
  const stem = day.getHeavenStem().getName();
  const branch = day.getEarthBranch().getName();
  return { stem, branch, text: `${stem}${branch}` };
}

export function getLunarMonthBranch(date: Date): string {
  const solarTime = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );

  const eightChar = solarTime.getLunarHour().getEightChar();
  return eightChar.getMonth().getEarthBranch().getName();
}

export function calcLiuyaoGanzhiFromIso(iso: string): { monthBranch: string; dayGanzhi: string; dayStem: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const monthBranch = getLunarMonthBranch(d);
  const day = getGanzhiDay(d);
  return { monthBranch, dayGanzhi: day.text, dayStem: day.stem };
}
