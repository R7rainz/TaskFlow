import speakeasy from "speakeasy";
import Qrcode from "qrcode";
import { PrismaClient } from "../../generate/prisma";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

export const setup2FA = async (userId: string, userEmail: string) => {
  try {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `TaskFlow (${userEmail})`,
      issuer: "TaskFlow",
    });

    const otpath_url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userEmail,
      issuer: "TaskFlow",
    });

    const qrCodeDataURL = await Qrcode.toDataURL(otpath_url);

    const backupCodes = Array.from({ length: 7 }, () => {
      Math.random().toString(36).slice(-8).toUpperCase();
    });

    const encryptedSecret = CryptoJS.AES.encrypt(
      secret.base32!,
      process.env.ENCRYPTION_KEY!,
    ).toString();

    const encryptedBackupCodes = CryptoJS.AES.encrypt(
      JSON.stringify(backupCodes),
      process.env.ENCRYPTION_KEY!,
    ).toString();

    return {
      qrCodeDataURL,
      manualEntryCode: secret.base32,
      backupCodes,
      encryptedSecret,
      encryptedBackupCodes,
    };
  } catch (error: any) {
    throw new Error("2FA setup failed: " + error.message);
  }
};

export const verifyAndEnable2FA = async (
  userId: string,
  tempEncryptedSecret: string,
  otpCode: string,
  backupCodes: string[],
) => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("Encryption key not configured");
  }
  const decryptedBytes = CryptoJS.AES.decrypt(
    tempEncryptedSecret,
    process.env.ENCRYPTION_KEY!,
  );
  const decryptedSecret = decryptedBytes.toString(CryptoJS.enc.Utf8);
  const isVerified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: "base32",
    token: otpCode,
    window: 1,
  });
  if (!isVerified) {
    throw new Error("Invalid OTP code");
  }

  const encryptedSecret = CryptoJS.AES.encrypt(
    decryptedSecret,
    process.env.ENCRYPTION_KEY,
  ).toString();

  const encryptedBackupCodes = CryptoJS.AES.encrypt(
    JSON.stringify(backupCodes),
    process.env.ENCRYPTION_KEY,
  ).toString();

  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: encryptedBackupCodes,
      twoFactorSetupAt: new Date(),
    },
  });
};

export const generateBackupCodes = (): string[] => {
  return Array.from({ length: 7 }, () =>
    Math.random().toString(36).slice(-8).toUpperCase(),
  );
};
