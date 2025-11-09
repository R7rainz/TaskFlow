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

    const qrCodeDataURL = await Qrcode.toDataURL(secret.otpauth_url!);

    const backupCodes = Array.from({ length: 7 }, () => {
      return Math.random().toString(36).slice(-8).toUpperCase();
    });

    const encryptedSecret = CryptoJS.AES.encrypt(
      secret.base32!,
      process.env.ENCRYPTION_KEY!,
    ).toString();

    return {
      qrCodeDataURL,
      manualEntryCode: secret.base32,
      backupCodes,
      encryptedSecret,
    };
  } catch (error: any) {
    throw new Error("2FA setup failed: " + error.message);
  }
};

export const verify2FAWithOTP = async (
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
    process.env.ENCRYPTION_KEY,
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

  const encryptedBackupcodes = CryptoJS.AES.encrypt(
    JSON.stringify(backupCodes),
    process.env.ENCRYPTION_KEY,
  ).toString();

  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: encryptedBackupcodes,
      twoFactorSetupAt: new Date(),
    },
  });

  return { backupCodes };
};

export const verify2FAWithBackupCodes = async (
  userId: string,
  backupCode: string,
  userEmail: string,
) => {
  try {
    const codes = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { twoFactorBackupCodes: true },
    });

    if (!codes) {
      throw new Error("User not found");
    }

    if (!codes.twoFactorBackupCodes) {
      throw new Error("No backup codes found");
    }

    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("Encrypted key missing");
    }

    const existingEncryptedBackupCodes = codes.twoFactorBackupCodes;

    const decryptedBackupCodes = CryptoJS.AES.decrypt(
      existingEncryptedBackupCodes,
      process.env.ENCRYPTION_KEY,
    );

    const decryptedBackupCodesString = decryptedBackupCodes.toString(
      CryptoJS.enc.Utf8,
    );

    const backupCodesArray = JSON.parse(decryptedBackupCodesString);

    const codeIndex = backupCodesArray.indexOf(backupCode);
    if (codeIndex === -1) {
      throw new Error("Invalid backup code");
    }

    backupCodesArray.splice(codeIndex, 1);

    const newSecret = speakeasy.generateSecret({
      length: 20,
      name: `Taskflow(${userEmail})`,
      issuer: `TaskFlow`,
    });

    const qrCodeDataURL = await Qrcode.toDataURL(newSecret.otpauth_url!);

    const updatedEncryptedBackupCodes = CryptoJS.AES.encrypt(
      JSON.stringify(backupCodesArray),
      process.env.ENCRYPTION_KEY,
    ).toString();

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        twoFactorBackupCodes: updatedEncryptedBackupCodes,
        twoFactorSecret: CryptoJS.AES.encrypt(
          newSecret.base32!,
          process.env.ENCRYPTION_KEY,
        ).toString(),
      },
    });

    return {
      backupCodes: backupCodesArray,
      newSecret: newSecret.base32,
      qrCodeDataURL: qrCodeDataURL,
    };
  } catch (err: any) {
    throw new Error("2FA backup verification failed: " + err.message);
  }
};
