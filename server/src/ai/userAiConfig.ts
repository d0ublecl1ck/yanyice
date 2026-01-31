import type { PrismaClient, AiVendor } from "@prisma/client";

import { decryptSecret, encryptSecret } from "./crypto";
import { getAiCredentialsMasterKey } from "../config";

export type PublicUserAiConfig = {
  vendor: AiVendor;
  model: string;
  hasApiKey: boolean;
};

export async function getUserAiVendor(prisma: PrismaClient, userId: string): Promise<AiVendor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiVendor: true },
  });
  return user?.aiVendor ?? "zhipu";
}

export async function setUserAiVendor(prisma: PrismaClient, userId: string, vendor: AiVendor): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { aiVendor: vendor },
  });
}

export async function getUserAiConfigByVendor(
  prisma: PrismaClient,
  userId: string,
  vendor: AiVendor,
): Promise<PublicUserAiConfig> {
  const config = await prisma.userAiConfig.findFirst({
    where: { userId, vendor },
    select: { vendor: true, model: true },
  });

  const cred = await prisma.userAiCredential.findFirst({
    where: { userId, vendor },
    select: { id: true },
  });

  return {
    vendor,
    model: config?.model ?? "",
    hasApiKey: Boolean(cred),
  };
}

export async function getUserAiConfig(prisma: PrismaClient, userId: string): Promise<PublicUserAiConfig> {
  const vendor = await getUserAiVendor(prisma, userId);
  return getUserAiConfigByVendor(prisma, userId, vendor);
}

export async function upsertUserAiConfig(
  prisma: PrismaClient,
  userId: string,
  input: { vendor: AiVendor; model: string; apiKey?: string },
): Promise<PublicUserAiConfig> {
  const vendor: AiVendor = input.vendor;
  const model = input.model;
  const apiKey = input.apiKey;

  await prisma.userAiConfig.upsert({
    where: { userId_vendor: { userId, vendor } },
    create: { userId, vendor, model },
    update: { model },
  });

  if (typeof apiKey === "string") {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      await prisma.userAiCredential.deleteMany({ where: { userId, vendor } });
    } else {
      const key = getAiCredentialsMasterKey();
      const enc = encryptSecret(trimmed, key);
      await prisma.userAiCredential.upsert({
        where: { userId_vendor: { userId, vendor } },
        create: {
          userId,
          vendor,
          apiKeyCipher: enc.cipherTextB64,
          apiKeyIv: enc.ivB64,
          apiKeyTag: enc.tagB64,
        },
        update: {
          apiKeyCipher: enc.cipherTextB64,
          apiKeyIv: enc.ivB64,
          apiKeyTag: enc.tagB64,
        },
      });
    }
  }

  return getUserAiConfigByVendor(prisma, userId, vendor);
}

export async function getUserAiApiKey(prisma: PrismaClient, userId: string, vendor: AiVendor): Promise<string | null> {
  const cred = await prisma.userAiCredential.findFirst({
    where: { userId, vendor },
    select: { apiKeyCipher: true, apiKeyIv: true, apiKeyTag: true },
  });
  if (!cred) return null;
  const key = getAiCredentialsMasterKey();
  return decryptSecret(
    { cipherTextB64: cred.apiKeyCipher, ivB64: cred.apiKeyIv, tagB64: cred.apiKeyTag },
    key,
  );
}
