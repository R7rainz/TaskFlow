import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generate/prisma";
import {
  setup2FA,
  verify2FAWithBackupCodes,
  verify2FAWithOTP,
  verifyLoginWithBackupCodes,
  verifyLoginWithOTP,
} from "../services/twoFactorService";

const prisma = new PrismaClient();

export const setup2FAController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get userId from req.user and using this, get user email from DB
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Call setup2FA service
    const result = await setup2FA(user.email);

    // 4. Decide what to return to frontend
    res.json({
      qrCode: result.qrCodeDataURL,
      manualEntryCode: result.manualEntryCode,
      backupCodes: result.backupCodes,
      encryptedSecret: result.encryptedSecret,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const verify2FAWithOTPController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { otpCode, tempEncryptedSecret, backupCodes } = req.body;

    if (!otpCode || !tempEncryptedSecret || !backupCodes) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof otpCode !== "string" || otpCode.length !== 6) {
      return res.status(400).json({ error: "OTP Code must be of 6 digit" });
    }
    if (!/^\d{6}$/.test(otpCode)) {
      return res
        .status(400)
        .json({ error: "OTP code must contain only numbers" });
    }

    const result = await verify2FAWithOTP(
      userId.toString(),
      tempEncryptedSecret,
      otpCode,
      backupCodes,
    );

    res.json({
      message: "2FA verified successfully",
      backupCodes: result.backupCodes,
    });
  } catch (err) {
    next(err);
  }
};

export const verify2FAWithBackupCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { backupCode, userEmail } = req.body;

    if (!backupCode || !userEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof backupCode !== "string" || backupCode.length !== 7) {
      return res
        .status(400)
        .json({ error: "Backup code must be 8 characters" });
    }

    const result = await verify2FAWithBackupCodes(
      userId,
      backupCode,
      userEmail,
    );
    return res.json({
      message: "2FA verified successfully",
      backupCodes: result.backupCodes,
      newSecret: result.newSecret,
      qrCodeDataURL: result.qrCodeDataURL,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLoginWithOTPController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, otpCode } = req.body;
    if (!userId || !otpCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await verifyLoginWithOTP(userId, otpCode);

    res.status(200).json({
      message: "Login successfull",
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLoginWithBackupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, backupCode } = req.body;
    if (!userId || !backupCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof backupCode !== "string" || backupCode.length !== 7) {
      return res
        .status(400)
        .json({ error: "Backup code must be 8 characters" });
    }
    const result = await verifyLoginWithBackupCodes(userId, backupCode);

    res.status(200).json({
      message: "Login successfull",
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      remainingBackupCodes: result.remainingBackupCodes,
    });
  } catch (err) {
    next(err);
  }
};
