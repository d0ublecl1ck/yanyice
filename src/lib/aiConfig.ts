export const DEFAULT_AI_VENDOR = "zhipu";
export const DEFAULT_AI_MODEL = "";
export const DEFAULT_AI_API_KEY = "";

export const MAX_AI_VENDOR_LENGTH = 48;
export const MAX_AI_MODEL_LENGTH = 80;
export const MAX_AI_API_KEY_LENGTH = 200;

export type AiConfig = {
  vendor: string;
  model: string;
  apiKey: string;
};

function sanitizeOptionalValue(input: string, maxLen: number): string | null {
  const value = input.trim();
  if (value.length > maxLen) return null;
  return value;
}

export function sanitizeAiVendor(input: string): string | null {
  const value = sanitizeOptionalValue(input, MAX_AI_VENDOR_LENGTH);
  if (value === null) return null;
  if (!value) return null;
  return value;
}

export function sanitizeAiModel(input: string): string | null {
  return sanitizeOptionalValue(input, MAX_AI_MODEL_LENGTH);
}

export function sanitizeAiApiKey(input: string): string | null {
  return sanitizeOptionalValue(input, MAX_AI_API_KEY_LENGTH);
}

export function getDefaultAiConfig(): AiConfig {
  return {
    vendor: DEFAULT_AI_VENDOR,
    model: DEFAULT_AI_MODEL,
    apiKey: DEFAULT_AI_API_KEY,
  };
}
