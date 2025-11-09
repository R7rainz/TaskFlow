"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify2FAWithBackupCodes = exports.verify2FAWithOTP = exports.setup2FA = void 0;
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
        const qrCodeDataURL = await qrcode_1.default.toDataURL(secret.otpauth_url);
        const backupCodes = Array.from({ length: 7 }, () => {
            return Math.random().toString(36).slice(-8).toUpperCase();
        });
        const encryptedSecret = crypto_js_1.default.AES.encrypt(secret.base32, process.env.ENCRYPTION_KEY).toString();
        return {
            qrCodeDataURL,
            manualEntryCode: secret.base32,
            backupCodes,
            encryptedSecret,
        };
    }
    catch (error) {
        throw new Error("2FA setup failed: " + error.message);
    }
};
exports.setup2FA = setup2FA;
const verify2FAWithOTP = async (userId, tempEncryptedSecret, otpCode, backupCodes) => {
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
    const encryptedBackupcodes = crypto_js_1.default.AES.encrypt(JSON.stringify(backupCodes), process.env.ENCRYPTION_KEY).toString();
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
exports.verify2FAWithOTP = verify2FAWithOTP;
const verify2FAWithBackupCodes = async (userId, backupCode, userEmail) => {
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
        const decryptedBackupCodes = crypto_js_1.default.AES.decrypt(existingEncryptedBackupCodes, process.env.ENCRYPTION_KEY);
        const decryptedBackupCodesString = decryptedBackupCodes.toString(crypto_js_1.default.enc.Utf8);
        const backupCodesArray = JSON.parse(decryptedBackupCodesString);
        const codeIndex = backupCodesArray.indexOf(backupCode);
        if (codeIndex === -1) {
            throw new Error("Invalid backup code");
        }
        backupCodesArray.splice(codeIndex, 1);
        const newSecret = speakeasy_1.default.generateSecret({
            length: 20,
            name: `Taskflow(${userEmail})`,
            issuer: `TaskFlow`,
        });
        const qrCodeDataURL = await qrcode_1.default.toDataURL(newSecret.otpauth_url);
        const updatedEncryptedBackupCodes = crypto_js_1.default.AES.encrypt(JSON.stringify(backupCodesArray), process.env.ENCRYPTION_KEY).toString();
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                twoFactorBackupCodes: updatedEncryptedBackupCodes,
                twoFactorSecret: crypto_js_1.default.AES.encrypt(newSecret.base32, process.env.ENCRYPTION_KEY).toString(),
            },
        });
        return {
            backupCodes: backupCodesArray,
            newSecret: newSecret.base32,
            qrCodeDataURL: qrCodeDataURL,
        };
    }
    catch (err) {
        throw new Error("2FA backup verification failed: " + err.message);
    }
};
exports.verify2FAWithBackupCodes = verify2FAWithBackupCodes;
