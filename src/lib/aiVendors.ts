export type AiVendorId =
  | "zhipu";

export type AiVendor = {
  id: AiVendorId;
  label: string;
  modelPlaceholder?: string;
  modelRecommendedHint?: string;
  apiKeyHint?: string;
};

export const AI_VENDORS: AiVendor[] = [
  {
    id: "zhipu",
    label: "智谱 BigModel",
    modelPlaceholder: "glm-4v-flash",
    modelRecommendedHint: "示例：glm-4.6（留空使用默认值）",
    apiKeyHint: "在智谱开放平台获取",
  },
];

export function getAiVendorById(id: string): AiVendor | null {
  return AI_VENDORS.find((v) => v.id === id) ?? null;
}
