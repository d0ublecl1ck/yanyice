import type { ModuleType } from "@prisma/client";

export type SeedRuleTemplate = {
  seedKey: string;
  module: ModuleType;
  name: string;
  condition: string;
  message: string;
  enabled: boolean;
};

const SEED_RULES: Record<ModuleType, SeedRuleTemplate[]> = {
  liuyao: [
    {
      seedKey: "liuyao-001-yongshen-shouke",
      module: "liuyao",
      name: "用神受克",
      enabled: true,
      condition: "用神受克/受制",
      message: "用神受克，多主所问不顺；须看旺衰与制化，得生扶则可转机。",
    },
    {
      seedKey: "liuyao-002-yongshen-de-sheng",
      module: "liuyao",
      name: "用神得生",
      enabled: true,
      condition: "用神得生扶/得助",
      message: "用神得生，多主有助力；若再得日月扶持，事势更稳。",
    },
    {
      seedKey: "liuyao-003-shi-ying-xiang-chong",
      module: "liuyao",
      name: "世应相冲",
      enabled: true,
      condition: "世爻与应爻相冲",
      message: "世应相冲，多主对立不合；宜避硬碰，求缓和之策。",
    },
    {
      seedKey: "liuyao-004-dong-yao-hua-ke",
      module: "liuyao",
      name: "动爻化克",
      enabled: true,
      condition: "动爻变爻对用神成克",
      message: "动而化克，多主先动后阻；宜防过程反复、临门生变。",
    },
    {
      seedKey: "liuyao-005-liu-chong",
      module: "liuyao",
      name: "六冲卦",
      enabled: true,
      condition: "卦象六冲",
      message: "六冲主散，易变动分离；若问成事，多先难后成或成而复散。",
    },
    {
      seedKey: "liuyao-006-liu-he",
      module: "liuyao",
      name: "六合卦",
      enabled: true,
      condition: "卦象六合",
      message: "六合主合，利于和合成就；但亦可能拖延，需看动静与时机。",
    },
  ],
  bazi: [
    {
      seedKey: "bazi-001-sui-yun-bing-lin",
      module: "bazi",
      name: "岁运并临",
      enabled: true,
      condition: "流年与大运同柱",
      message: "岁运并临，吉凶放大；宜趋吉避凶，重要决策需谨慎。",
    },
    {
      seedKey: "bazi-002-shen-wang-xi-xie",
      module: "bazi",
      name: "身旺喜泄",
      enabled: true,
      condition: "日主偏旺",
      message: "身旺宜泄宜克；取食伤财官为用，忌再生扶导致过旺。",
    },
    {
      seedKey: "bazi-003-shen-ruo-xi-fu",
      module: "bazi",
      name: "身弱喜扶",
      enabled: true,
      condition: "日主偏弱",
      message: "身弱宜扶宜助；取印比为用，忌财官太过而成压制。",
    },
    {
      seedKey: "bazi-004-cai-xing-jian-guan",
      module: "bazi",
      name: "财星见官",
      enabled: true,
      condition: "财星与官星并见",
      message: "财官并见，多主事务与责任并至；看身强弱与格局，取其顺势而为。",
    },
    {
      seedKey: "bazi-005-yin-xing-hua-sha",
      module: "bazi",
      name: "印星化杀",
      enabled: true,
      condition: "七杀重而有印",
      message: "杀旺有印可化，主压力转助力；若印弱，则易感束缚与冲突。",
    },
    {
      seedKey: "bazi-006-shang-guan-jian-guan",
      module: "bazi",
      name: "伤官见官",
      enabled: true,
      condition: "伤官与官星同现",
      message: "伤官见官，多主口舌是非；宜收敛锋芒，重视规则与边界。",
    },
  ],
};

export function getSeedRules(module?: ModuleType): SeedRuleTemplate[] {
  if (module) return SEED_RULES[module];
  return [...SEED_RULES.liuyao, ...SEED_RULES.bazi];
}

