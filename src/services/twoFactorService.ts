import speakeasy from "speakeasy";
import Qrcode from "qrcode";
import { PrismaClient } from "../../generate/prisma";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const prisma = new PrismaClient();

export const setup2FA = async (userEmail: string) => {
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

export const verifyLoginWithOTP = async (userId: string, otpCode: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        id: true,
        name: true,
        email: true,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.twoFactorSecret) throw new Error("2FA not enabled for this user");
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("Encryption key not configured");
    }

    const decryptedBytes = CryptoJS.AES.decrypt(
      user.twoFactorSecret,
      process.env.ENCRYPTION_KEY,
    );

    const decryptedSecret = decryptedBytes.toString(CryptoJS.enc.Utf8);

    const isVerified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: otpCode,
      window: 1,
    });

    if (!isVerified) throw new Error("Invalid OTP Code");

    //returning tokens
    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "15m",
    });
    const refreshToken = crypto.randomBytes(32).toString("hex");

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
      refreshToken,
    };
  } catch (err: any) {
    throw new Error("2FA login verification failed: " + err.message);
  }
};

export const verifyLoginWithBackupCodes = async (
  userId: string,
  backupCode: string,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) throw new Error("User not found");
    if (!user.twoFactorBackupCodes) throw new Error("BackupCodes not found");
    if (!process.env.ENCRYPTION_KEY)
      throw new Error("Encryption key not found");

    const decryptedBackupCodes = CryptoJS.AES.decrypt(
      user.twoFactorBackupCodes,
      process.env.ENCRYPTION_KEY,
    );

    const decryptedBackupCodesArray = JSON.parse(
      decryptedBackupCodes.toString(CryptoJS.enc.Utf8),
    );

    const codeIndex = decryptedBackupCodesArray.indexOf(backupCode);
    if (codeIndex === -1) throw new Error("Invalid backup code");

    decryptedBackupCodesArray.splice(codeIndex, 1);

    const updatedEncryptedBackupCodes = CryptoJS.AES.encrypt(
      JSON.stringify(decryptedBackupCodesArray),
      process.env.ENCRYPTION_KEY,
    ).toString();

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        twoFactorBackupCodes: updatedEncryptedBackupCodes,
      },
    });

    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "15m",
    });
    const refreshToken = crypto.randomBytes(32).toString("hex");

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
      refreshToken,
      remainingBackupCodes: decryptedBackupCodesArray.length,
    };
  } catch (err: any) {
    throw new Error("BackupCodes login verification failed");
  }
};
