export type AiVendorId = "zhipu" | "openai";

export type AiVendor = {
  id: AiVendorId;
  label: string;

  apiKeyLinkLabel: string;
  apiKeyUrl: string;

  models: string[];
  modelEmptyLabel?: string;
};

const registry: AiVendor[] = [];

export function registerAiVendor(vendor: AiVendor) {
  const exists = registry.some((v) => v.id === vendor.id);
  if (exists) throw new Error(`AiVendor already registered: ${vendor.id}`);
  registry.push(vendor);
}

export function getAiVendors(): AiVendor[] {
  return [...registry];
}

export function getAiVendorById(id: string): AiVendor | null {
  return registry.find((v) => v.id === id) ?? null;
}

registerAiVendor({
  id: "zhipu",
  label: "智谱 BigModel",
  apiKeyLinkLabel: "在智谱开放平台获取",
  apiKeyUrl: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
  models: ["glm-4.6v", "glm-4.6v-flashx", "glm-4.6v-flash"],
  modelEmptyLabel: "（未设置）",
});

registerAiVendor({
  id: "openai",
  label: "OpenAI",
  apiKeyLinkLabel: "在 OpenAI 平台获取",
  apiKeyUrl: "https://platform.openai.com/api-keys",
  models: ["o4-mini", "gpt-4.1", "gpt-5.2"],
  modelEmptyLabel: "（未设置）",
});
