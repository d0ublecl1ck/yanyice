export type ZodiacKey =
  | "rat"
  | "ox"
  | "tiger"
  | "rabbit"
  | "dragon"
  | "snake"
  | "horse"
  | "goat"
  | "monkey"
  | "rooster"
  | "dog"
  | "pig";

const ZODIAC_ICON_SRC: Record<ZodiacKey, string> = {
  rat: "/icons/zodiac/rat.svg",
  ox: "/icons/zodiac/ox.svg",
  tiger: "/icons/zodiac/tiger.svg",
  rabbit: "/icons/zodiac/rabbit.svg",
  dragon: "/icons/zodiac/dragon.svg",
  snake: "/icons/zodiac/snake.svg",
  horse: "/icons/zodiac/horse.svg",
  goat: "/icons/zodiac/goat.svg",
  monkey: "/icons/zodiac/monkey.svg",
  rooster: "/icons/zodiac/rooster.svg",
  dog: "/icons/zodiac/dog.svg",
  pig: "/icons/zodiac/pig.svg",
};

const ZODIAC_NAME_CN: Record<ZodiacKey, string> = {
  rat: "鼠",
  ox: "牛",
  tiger: "虎",
  rabbit: "兔",
  dragon: "龙",
  snake: "蛇",
  horse: "马",
  goat: "羊",
  monkey: "猴",
  rooster: "鸡",
  dog: "狗",
  pig: "猪",
};

const BRANCH_TO_ZODIAC: Record<string, ZodiacKey> = {
  子: "rat",
  丑: "ox",
  寅: "tiger",
  卯: "rabbit",
  辰: "dragon",
  巳: "snake",
  午: "horse",
  未: "goat",
  申: "monkey",
  酉: "rooster",
  戌: "dog",
  亥: "pig",
};

export type ZodiacInfo = {
  key: ZodiacKey;
  nameCn: string;
  iconSrc: string;
};

export function zodiacInfoFromBranch(branch?: string | null): ZodiacInfo | null {
  const normalized = branch?.trim();
  if (!normalized) return null;
  const key = BRANCH_TO_ZODIAC[normalized];
  if (!key) return null;
  return { key, nameCn: ZODIAC_NAME_CN[key], iconSrc: ZODIAC_ICON_SRC[key] };
}
