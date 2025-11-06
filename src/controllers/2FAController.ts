import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generate/prisma";
import { setup2FA, verifyAndEnable2FA } from "../services/twoFactorService";
import { generateBackupCodes } from "../services/twoFactorService";

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
    const result = await setup2FA(userId.toString(), user.email);

    // 4. Decide what to return to frontend
    res.json({
      qrCode: result.qrCodeDataURL,
      manualEntryCode: result.manualEntryCode,
      backupCodes: result.backupCodes,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const verifyAndEnable2FAController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { otpCode, tempEncryptedSecret, backupCodes } = req.body;

    if (!otpCode || !tempEncryptedSecret || !backupCodes) {
      return res.status(400).json({ error: "Missing required fields " });
    }

    await verifyAndEnable2FA(
      userId.toString(),
      tempEncryptedSecret,
      otpCode,
      backupCodes,
    );
    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    next(err);
  }
};

export const verify2FAWithOTPController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { otpCode, tempEncryptedSecret } = req.body;
    //TODO: Add validation
    if (!otpCode || !tempEncryptedSecret) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof otpCode !== "string" || otpCode.length !== 6) {
      return res.status(400).json({ error: "OTP code must be of 6 digits" });
    }
    if (!/^\d{6}$/.test(otpCode)) {
      return res
        .status(400)
        .json({ error: "OTP code must contain only numbers" });
    }

    const backupCodes = generateBackupCodes();

    await verifyAndEnable2FA(
      userId.toString(),
      tempEncryptedSecret,
      otpCode,
      backupCodes,
    );
    res.json({
      message: "2FA verified successfully",
      backupCodes: backupCodes,
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
    const { backupCode, backupCodes } = req.body;

    if (!backupCode || !backupCodes) {
      return res.status(404).json({ error: "Missing required fields" });
    }
    if (typeof backupCode !== "string" || backupCode.length < 6) {
      return res.status(400).json({ error: "Invalid backup code format" });
    }
    if (!Array.isArray(backupCodes)) {
      return res.status(400).json({ error: "Backup codes must be an array" });
    }

    //TODO: verify backup codes exists in the array
    if (!backupCodes.includes(backupCode)) {
      return res.json(400).json({ error: "Invalid backup code " });
    }
  } catch (err) {
    next(err);
  }
};
