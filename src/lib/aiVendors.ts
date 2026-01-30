export type AiVendorId =
  | "google"
  | "openai"
  | "zhipu"
  | "deepseek"
  | "tongyi"
  | "kimi"
  | "volcengine"
  | "openai_compatible";

export type AiVendor = {
  id: AiVendorId;
  label: string;
  modelPlaceholder?: string;
  modelRecommendedHint?: string;
  apiKeyHint?: string;
};

export const AI_VENDORS: AiVendor[] = [
  {
    id: "google",
    label: "Google (Gemini)",
    modelPlaceholder: "gemini-3-pro-preview",
    modelRecommendedHint: "推荐：gemini-3-pro-preview（留空使用默认值）",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "openai",
    label: "OpenAI",
    modelPlaceholder: "例如：gpt-4o-mini",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "zhipu",
    label: "智谱",
    modelPlaceholder: "例如：glm-4v-flash",
    modelRecommendedHint: "示例：glm-4.6（留空使用默认值）",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    modelPlaceholder: "例如：deepseek-chat",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "tongyi",
    label: "通义千问",
    modelPlaceholder: "例如：qwen-plus",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "kimi",
    label: "Kimi（月之暗面）",
    modelPlaceholder: "例如：moonshot-v1-8k",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "volcengine",
    label: "火山引擎",
    modelPlaceholder: "例如：doubao-lite-4k",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
  {
    id: "openai_compatible",
    label: "OpenAI 兼容 API",
    modelPlaceholder: "填写对方提供的模型名",
    modelRecommendedHint: "留空使用默认值",
    apiKeyHint: "在对应厂家控制台获取",
  },
];

export function getAiVendorById(id: string): AiVendor | null {
  return AI_VENDORS.find((v) => v.id === id) ?? null;
}

