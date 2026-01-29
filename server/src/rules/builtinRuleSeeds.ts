export type BuiltinRuleSeed = Readonly<{
  seedKey: string;
  module: "liuyao" | "bazi";
  name: string;
  enabled: boolean;
  condition: string;
  message: string;
}>;

export const BUILTIN_RULE_SEEDS: ReadonlyArray<BuiltinRuleSeed> = [
  {
    seedKey: "builtin:default",
    module: "liuyao",
    name: "动爻克用神",
    enabled: true,
    condition: "动爻五行克制用神五行",
    message: "注意：当前卦象中存在动爻克制用神的情况，请详察应期。",
  },
];

