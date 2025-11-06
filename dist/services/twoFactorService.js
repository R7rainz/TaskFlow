"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndEnable2FA = exports.setup2FA = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../../generate/prisma");
const crypto_js_1 = __importDefault(require("crypto-js"));
const prisma = new prisma_1.PrismaClient();
const setup2FA = async (userId, userEmail) => {
    try {
        const secret = speakeasy_1.default.generateSecret({
            length: 20,
            name: `TaskFlow (${userEmail})`,
            issuer: "TaskFlow",
        });
        const otpath_url = speakeasy_1.default.otpauthURL({
            secret: secret.base32,
            label: userEmail,
            issuer: "TaskFlow",
        });
        const qrCodeDataURL = await qrcode_1.default.toDataURL(otpath_url);
        const backupCodes = Array.from({ length: 7 }, () => {
            Math.random().toString(36).slice(-8).toUpperCase();
        });
        const encryptedSecret = crypto_js_1.default.AES.encrypt(secret.base32, process.env.ENCRYPTION_KEY).toString();
        const encryptedBackupCodes = crypto_js_1.default.AES.encrypt(JSON.stringify(backupCodes), process.env.ENCRYPTION_KEY).toString();
        return {
            qrCodeDataURL,
            manualEntryCode: secret.base32,
            backupCodes,
            encryptedSecret,
            encryptedBackupCodes,
        };
    }
    catch (error) {
        throw new Error("2FA setup failed: " + error.message);
    }
};
exports.setup2FA = setup2FA;
const verifyAndEnable2FA = async (userId, tempEncryptedSecret, otpCode, backupCodes) => {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error("Encryption key not configured");
    }
    const decryptedBytes = crypto_js_1.default.AES.decrypt(tempEncryptedSecret, process.env.ENCRYPTION_KEY);
    const decryptedSecret = decryptedBytes.toString(crypto_js_1.default.enc.Utf8);
    const isVerified = speakeasy_1.default.totp.verify({
        secret: decryptedSecret,
        encoding: "base32",
        token: otpCode,
        window: 1,
    });
    if (!isVerified) {
        throw new Error("Invalid OTP code");
    }
    const encryptedSecret = crypto_js_1.default.AES.encrypt(decryptedSecret, process.env.ENCRYPTION_KEY).toString();
    const encryptedBackupCodes = crypto_js_1.default.AES.encrypt(JSON.stringify(backupCodes), process.env.ENCRYPTION_KEY).toString();
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
exports.verifyAndEnable2FA = verifyAndEnable2FA;
