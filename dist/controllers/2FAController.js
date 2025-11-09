"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify2FAWithBackupCodeController = exports.verify2FAWithOTPController = exports.setup2FAController = void 0;
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
            encryptedSecret: result.encryptedSecret,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setup2FAController = setup2FAController;
// export const verifyAndEnable2FAController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = (req as any).user.userId;
//     const { otpCode, tempEncryptedSecret, backupCodes } = req.body;
//
//     if (!otpCode || !tempEncryptedSecret || !backupCodes) {
//       return res.status(400).json({ error: "Missing required fields " });
//     }
//
//     await verifyAndEnable2FA(
//       userId.toString(),
//       tempEncryptedSecret,
//       otpCode,
//       backupCodes,
//     );
//     res.json({ message: "2FA enabled successfully" });
//   } catch (err) {
//     next(err);
//   }
// };
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
