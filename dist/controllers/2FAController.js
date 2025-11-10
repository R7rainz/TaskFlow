"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.verifyLoginWithBackupController = exports.verifyLoginWithOTPController = exports.verify2FAWithBackupCodeController = exports.verify2FAWithOTPController = exports.setup2FAController = void 0;
const prisma_1 = require("../../generate/prisma");
const twoFactorService_1 = require("../services/twoFactorService");
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
        const result = await (0, twoFactorService_1.setup2FA)(user.email);
        // 4. Decide what to return to frontend
        res.json({
            qrCode: result.qrCodeDataURL,
            manualEntryCode: result.manualEntryCode,
            backupCodes: result.backupCodes,
            encryptedSecret: result.encryptedSecret,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setup2FAController = setup2FAController;
const verify2FAWithOTPController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
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
        const result = await (0, twoFactorService_1.verify2FAWithOTP)(userId.toString(), tempEncryptedSecret, otpCode, backupCodes);
        res.json({
            message: "2FA verified successfully",
            backupCodes: result.backupCodes,
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
        const { backupCode, userEmail } = req.body;
        if (!backupCode || !userEmail) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (typeof backupCode !== "string" || backupCode.length !== 7) {
            return res
                .status(400)
                .json({ error: "Backup code must be 8 characters" });
        }
        const result = await (0, twoFactorService_1.verify2FAWithBackupCodes)(userId, backupCode, userEmail);
        return res.json({
            message: "2FA verified successfully",
            backupCodes: result.backupCodes,
            newSecret: result.newSecret,
            qrCodeDataURL: result.qrCodeDataURL,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verify2FAWithBackupCodeController = verify2FAWithBackupCodeController;
const verifyLoginWithOTPController = async (req, res, next) => {
    try {
        const { userId, otpCode } = req.body;
        if (!userId || !otpCode) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await (0, twoFactorService_1.verifyLoginWithOTP)(userId, otpCode);
        res.status(200).json({
            message: "Login successfull",
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyLoginWithOTPController = verifyLoginWithOTPController;
const verifyLoginWithBackupController = async (req, res, next) => {
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
        const result = await (0, twoFactorService_1.verifyLoginWithBackupCodes)(userId, backupCode);
        res.status(200).json({
            message: "Login successfull",
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
            remainingBackupCodes: result.remainingBackupCodes,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyLoginWithBackupController = verifyLoginWithBackupController;
const logoutController = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res
                .status(401)
                .json({ message: "Authorzation header missing or malformed" });
        }
        const accessToken = authHeader.substring(7);
        const userId = req.user.userId;
    }
    catch (err) {
        next(err);
    }
};
exports.logoutController = logoutController;
