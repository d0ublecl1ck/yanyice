export const DEFAULT_AI_VENDOR = "google";
export const DEFAULT_AI_MODEL = "gemini-3-pro-preview";

export const MAX_AI_VENDOR_LENGTH = 48;
export const MAX_AI_MODEL_LENGTH = 80;

export type AiConfig = {
  vendor: string;
  model: string;
};

export function sanitizeAiVendor(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (value.length > MAX_AI_VENDOR_LENGTH) return null;
  return value;
}

export function sanitizeAiModel(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (value.length > MAX_AI_MODEL_LENGTH) return null;
  return value;
}

export function getDefaultAiConfig(): AiConfig {
  return { vendor: DEFAULT_AI_VENDOR, model: DEFAULT_AI_MODEL };
}

