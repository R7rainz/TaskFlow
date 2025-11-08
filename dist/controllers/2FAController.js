"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify2FAWithBackupCodeController = exports.verify2FAWithOTPController = exports.verifyAndEnable2FAController = exports.setup2FAController = void 0;
const prisma_1 = require("../../generate/prisma");
const twoFactorService_1 = require("../services/twoFactorService");
const twoFactorService_2 = require("../services/twoFactorService");
const prisma = new prisma_1.PrismaClient();
const setup2FAController = async (req, res, next) => {
    try {
        // Get userId from req.user and using this, get user email from DB
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 3. Call setup2FA service
        const result = await (0, twoFactorService_1.setup2FA)(userId.toString(), user.email);
        // 4. Decide what to return to frontend
        res.json({
            qrCode: result.qrCodeDataURL,
            manualEntryCode: result.manualEntryCode,
            backupCodes: result.backupCodes,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setup2FAController = setup2FAController;
const verifyAndEnable2FAController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { otpCode, tempEncryptedSecret, backupCodes } = req.body;
        if (!otpCode || !tempEncryptedSecret || !backupCodes) {
            return res.status(400).json({ error: "Missing required fields " });
        }
        await (0, twoFactorService_1.verifyAndEnable2FA)(userId.toString(), tempEncryptedSecret, otpCode, backupCodes);
        res.json({ message: "2FA enabled successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyAndEnable2FAController = verifyAndEnable2FAController;
const verify2FAWithOTPController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
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
        const backupCodes = (0, twoFactorService_2.generateBackupCodes)();
        await (0, twoFactorService_1.verifyAndEnable2FA)(userId.toString(), tempEncryptedSecret, otpCode, backupCodes);
        res.json({
            message: "2FA verified successfully",
            backupCodes: backupCodes,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verify2FAWithOTPController = verify2FAWithOTPController;
const verify2FAWithBackupCodeController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
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
        //removing the used one as we got that from the body
        const indexOfBackup = backupCodes.indexOf(backupCode);
        if (indexOfBackup > -1) {
            backupCodes.splice(indexOfBackup, 1);
        }
        //generate new totp secret 
        //idk how to do it 
    }
    catch (err) {
        next(err);
    }
};
exports.verify2FAWithBackupCodeController = verify2FAWithBackupCodeController;
