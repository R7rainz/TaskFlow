"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndEnable2FAController = exports.setup2FAController = void 0;
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
