import crypto from "node:crypto";

export type EncryptedSecret = {
  cipherTextB64: string;
  ivB64: string;
  tagB64: string;
};

export function encryptSecret(plainText: string, key: Buffer): EncryptedSecret {
  if (key.length !== 32) {
    throw new Error("encryptSecret: key must be 32 bytes");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const cipherText = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    cipherTextB64: cipherText.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
  };
}

export function decryptSecret(enc: EncryptedSecret, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error("decryptSecret: key must be 32 bytes");
  }

  const iv = Buffer.from(enc.ivB64, "base64");
  const tag = Buffer.from(enc.tagB64, "base64");
  const cipherText = Buffer.from(enc.cipherTextB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return plain.toString("utf8");
}

