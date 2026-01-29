import { calculateRelation, getShen } from "cantian-tymext";
import {
  ChildLimit,
  DefaultEightCharProvider,
  type Gender,
  type HeavenStem,
  LunarHour,
  LunarSect2EightCharProvider,
  type SixtyCycle,
  SolarTime,
} from "tyme4ts";

const providerSect1 = new DefaultEightCharProvider();
const providerSect2 = new LunarSect2EightCharProvider();

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeBjIso(parts: { y: number; m: number; d: number; h: number; min: number; sec: number }) {
  return `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}T${pad2(parts.h)}:${pad2(parts.min)}:${pad2(parts.sec)}+08:00`;
}

function parseToBjParts(input: string) {
  const raw = input.trim();
  const hasOffset = /([zZ]|[+-]\d\d:\d\d)$/.test(raw);
  if (hasOffset) {
    const instant = new Date(raw);
    if (Number.isNaN(instant.getTime())) {
      throw new Error("INVALID_BIRTH_DATE");
    }
    const bj = new Date(instant.getTime() + 8 * 60 * 60 * 1000);
    return {
      y: bj.getUTCFullYear(),
      m: bj.getUTCMonth() + 1,
      d: bj.getUTCDate(),
      h: bj.getUTCHours(),
      min: bj.getUTCMinutes(),
      sec: bj.getUTCSeconds(),
    };
  }

  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!m) throw new Error("INVALID_BIRTH_DATE");
  return {
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
    h: m[4] ? Number(m[4]) : 0,
    min: m[5] ? Number(m[5]) : 0,
    sec: m[6] ? Number(m[6]) : 0,
  };
}

function yinYangText(value: number) {
  return value === 1 ? "阳" : "阴";
}

function toGodsObject(eightCharText: string, gender: 0 | 1) {
  const gods = getShen(eightCharText, gender);
  return { year: gods[0], month: gods[1], day: gods[2], hour: gods[3] };
}

function buildHideHeaven(heavenStem: HeavenStem | null | undefined, me: HeavenStem) {
  if (!heavenStem) return undefined;
  return { stem: heavenStem.toString(), tenGod: me.getTenStar(heavenStem).toString() };
}

function buildPillarDetail(sixtyCycle: SixtyCycle, me?: HeavenStem) {
  const heavenStem = sixtyCycle.getHeavenStem();
  const earthBranch = sixtyCycle.getEarthBranch();
  const dayMaster = me ?? heavenStem;

  return {
    stem: {
      name: heavenStem.toString(),
      element: heavenStem.getElement().toString(),
      yinYang: yinYangText(heavenStem.getYinYang()),
      tenGod: dayMaster === heavenStem ? undefined : dayMaster.getTenStar(heavenStem).toString(),
    },
    branch: {
      name: earthBranch.toString(),
      element: earthBranch.getElement().toString(),
      yinYang: yinYangText(earthBranch.getYinYang()),
      hiddenStems: {
        main: buildHideHeaven(earthBranch.getHideHeavenStemMain(), dayMaster),
        middle: buildHideHeaven(earthBranch.getHideHeavenStemMiddle(), dayMaster),
        residual: buildHideHeaven(earthBranch.getHideHeavenStemResidual(), dayMaster),
      },
    },
    nayin: sixtyCycle.getSound().toString(),
    xun: sixtyCycle.getTen().toString(),
    kongWang: sixtyCycle.getExtraEarthBranches().join(""),
    starLuck: dayMaster.getTerrain(earthBranch).toString(),
    selfSeat: heavenStem.getTerrain(earthBranch).toString(),
  };
}

function buildDecadeFortune(solarTime: SolarTime, gender: Gender, me: HeavenStem) {
  const childLimit = ChildLimit.fromSolarTime(solarTime, gender);

  let decadeFortune = childLimit.getStartDecadeFortune();
  const startAge = decadeFortune.getStartAge();
  const startDate = childLimit.getEndTime();

  const list: Array<{
    gz: string;
    startYear: number;
    endYear: number;
    stemTenGod: string;
    branchTenGods: string[];
    branchHiddenStems: string[];
    startAge: number;
    endAge: number;
  }> = [];

  for (let i = 0; i < 10; i++) {
    const sixtyCycle = decadeFortune.getSixtyCycle();
    const heavenStem = sixtyCycle.getHeavenStem();
    const earthBranch = sixtyCycle.getEarthBranch();

    list.push({
      gz: sixtyCycle.toString(),
      startYear: decadeFortune.getStartSixtyCycleYear().getYear(),
      endYear: decadeFortune.getEndSixtyCycleYear().getYear(),
      stemTenGod: me.getTenStar(heavenStem).getName(),
      branchTenGods: earthBranch
        .getHideHeavenStems()
        .map((hs) => me.getTenStar(hs.getHeavenStem()).getName()),
      branchHiddenStems: earthBranch.getHideHeavenStems().map((hs) => hs.toString()),
      startAge: decadeFortune.getStartAge(),
      endAge: decadeFortune.getEndAge(),
    });

    decadeFortune = decadeFortune.next(1);
  }

  return {
    startDate: `${startDate.getYear()}-${pad2(startDate.getMonth())}-${pad2(startDate.getDay())}`,
    startAge,
    list,
  };
}

export type BaziDerived = {
  solarText: string;
  lunarText: string;
  baziText: string;
  zodiac: string;
  dayMaster: string;
  pillarsDetail: {
    year: ReturnType<typeof buildPillarDetail>;
    month: ReturnType<typeof buildPillarDetail>;
    day: ReturnType<typeof buildPillarDetail>;
    hour: ReturnType<typeof buildPillarDetail>;
  };
  shenSha: ReturnType<typeof toGodsObject>;
  relations: ReturnType<typeof calculateRelation>;
  decadeFortune: ReturnType<typeof buildDecadeFortune>;
  meta: {
    fixedTimezone: "+08:00";
    eightCharProviderSect: 1 | 2;
    gender: 0 | 1;
    computedAt: string;
    engine: string;
    engineVersion: string;
  };
};

export type BaziComputed = {
  birthDate: string;
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string;
  hourBranch: string;
  location?: string;
  isDst?: boolean;
  isTrueSolarTime?: boolean;
  isEarlyLateZi?: boolean;
  category?: string;
  derived: BaziDerived;
};

export function computeBaziFromBirthDate(args: {
  birthDate: string;
  gender: 0 | 1;
  eightCharProviderSect: 1 | 2;
  location?: string;
  isDst?: boolean;
  isTrueSolarTime?: boolean;
  isEarlyLateZi?: boolean;
  category?: string;
}): BaziComputed {
  const parts = parseToBjParts(args.birthDate);
  const birthDate = normalizeBjIso(parts);

  LunarHour.provider = args.eightCharProviderSect === 1 ? providerSect1 : providerSect2;

  const solarTime = SolarTime.fromYmdHms(parts.y, parts.m, parts.d, parts.h, parts.min, parts.sec);
  const lunarHour = solarTime.getLunarHour();
  const eightChar = lunarHour.getEightChar();
  const me = eightChar.getDay().getHeavenStem();

  const pillars = {
    year: {
      stem: eightChar.getYear().getHeavenStem().getName(),
      branch: eightChar.getYear().getEarthBranch().getName(),
    },
    month: {
      stem: eightChar.getMonth().getHeavenStem().getName(),
      branch: eightChar.getMonth().getEarthBranch().getName(),
    },
    day: {
      stem: eightChar.getDay().getHeavenStem().getName(),
      branch: eightChar.getDay().getEarthBranch().getName(),
    },
    hour: {
      stem: eightChar.getHour().getHeavenStem().getName(),
      branch: eightChar.getHour().getEarthBranch().getName(),
    },
  };

  const derived: BaziDerived = {
    solarText: lunarHour.getSolarTime().toString(),
    lunarText: lunarHour.toString(),
    baziText: eightChar.toString(),
    zodiac: eightChar.getYear().getEarthBranch().getZodiac().toString(),
    dayMaster: me.toString(),
    pillarsDetail: {
      year: buildPillarDetail(eightChar.getYear(), me),
      month: buildPillarDetail(eightChar.getMonth(), me),
      day: buildPillarDetail(eightChar.getDay()),
      hour: buildPillarDetail(eightChar.getHour(), me),
    },
    shenSha: toGodsObject(eightChar.toString(), args.gender),
    decadeFortune: buildDecadeFortune(lunarHour.getSolarTime(), args.gender as Gender, me),
    relations: calculateRelation({
      年: { 天干: pillars.year.stem, 地支: pillars.year.branch },
      月: { 天干: pillars.month.stem, 地支: pillars.month.branch },
      日: { 天干: pillars.day.stem, 地支: pillars.day.branch },
      时: { 天干: pillars.hour.stem, 地支: pillars.hour.branch },
    }),
    meta: {
      fixedTimezone: "+08:00",
      eightCharProviderSect: args.eightCharProviderSect,
      gender: args.gender,
      computedAt: new Date().toISOString(),
      engine: "tyme4ts+cantian-tymext",
      engineVersion: "A2/B1",
    },
  };

  return {
    birthDate,
    yearStem: pillars.year.stem,
    yearBranch: pillars.year.branch,
    monthStem: pillars.month.stem,
    monthBranch: pillars.month.branch,
    dayStem: pillars.day.stem,
    dayBranch: pillars.day.branch,
    hourStem: pillars.hour.stem,
    hourBranch: pillars.hour.branch,
    location: args.location,
    isDst: args.isDst,
    isTrueSolarTime: args.isTrueSolarTime,
    isEarlyLateZi: args.isEarlyLateZi,
    category: args.category,
    derived,
  };
}

