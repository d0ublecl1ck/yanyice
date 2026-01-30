import { SolarTime } from "tyme4ts";

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

const GANZHI_60 = Array.from({ length: 60 }, (_, idx) => `${STEMS[idx % 10]}${BRANCHES[idx % 12]}`);

function calcXunKongByDayGanzhi(dayGanzhi: string): string | null {
  if (dayGanzhi.length !== 2) return null;
  const idx = GANZHI_60.indexOf(dayGanzhi);
  if (idx === -1) return null;

  const xunStartIdx = idx - (idx % 10);
  const startGanzhi = GANZHI_60[xunStartIdx];
  const startBranch = startGanzhi?.[1] ?? "";
  const startBranchIdx = BRANCHES.indexOf(startBranch);
  if (startBranchIdx === -1) return null;

  const empty1 = BRANCHES[(startBranchIdx + 10) % 12] ?? "";
  const empty2 = BRANCHES[(startBranchIdx + 11) % 12] ?? "";
  if (!empty1 || !empty2) return null;
  return `${empty1}${empty2}`;
}

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

export function getGanzhiFourPillars(date: Date): {
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
  xunKong: string | null;
} {
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
  const day = eightChar.getDay();
  const hour = eightChar.getHour();

  const yearGanzhi = `${year.getHeavenStem().getName()}${year.getEarthBranch().getName()}`;
  const monthGanzhi = `${month.getHeavenStem().getName()}${month.getEarthBranch().getName()}`;
  const dayGanzhi = `${day.getHeavenStem().getName()}${day.getEarthBranch().getName()}`;
  const hourGanzhi = `${hour.getHeavenStem().getName()}${hour.getEarthBranch().getName()}`;

  return {
    yearGanzhi,
    monthGanzhi,
    dayGanzhi,
    hourGanzhi,
    xunKong: calcXunKongByDayGanzhi(dayGanzhi),
  };
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
