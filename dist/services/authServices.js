"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAllDevices = exports.logoutUser = exports.resetPassword = exports.initiatePasswordReset = exports.refresh = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../generate/prisma");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new prisma_1.PrismaClient();
const registerUser = async (name, email, password) => {
    //checking if the email already exists in the database
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error("User Already Exists");
    const hashed = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma.user.create({
        data: { name, email, password: hashed },
    });
    return user;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user)
        throw new Error("User not found, please register");
    //checking if password is valid (the password is what we get from the body the user.password is from the database obv)
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        throw new Error("Invalid password");
    if (user.twoFactorEnabled) {
        return {
            requires2FA: true,
            userId: user.id,
            message: "Two-factor authentication required",
        };
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    const refreshTokenValue = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshTokenValue,
                expiresAt,
            },
        });
    }
    catch (err) {
        throw new Error("Failed to create refresh token");
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, tokenVersion: user.tokenVersion }, jwtSecret, {
        expiresIn: "15m",
    });
    return {
        user: { id: user.id, name: user.name, email: user.email },
        token,
        refreshToken: refreshTokenValue,
    };
};
exports.loginUser = loginUser;
const refresh = async (refreshToken) => {
    // Find the refresh token in the database
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        select: { userId: true, expiresAt: true },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired refresh token");
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    const user = await prisma.user.findUnique({
        where: { id: storedToken.userId },
        select: { tokenVersion: true },
    });
    if (!user) {
        throw new Error("User not found");
    }
    //generating new accessToken
    const newAccessToken = jsonwebtoken_1.default.sign({ userId: storedToken.userId, tokenVersion: user.tokenVersion }, jwtSecret, {
        expiresIn: "15m",
    });
    return {
        accessToken: newAccessToken,
        refreshToken: refreshToken,
    };
};
exports.refresh = refresh;
const initiatePasswordReset = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("User with this email does not exist");
    }
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            token: resetToken,
            expiresAt,
        },
    });
    return resetToken;
};
exports.initiatePasswordReset = initiatePasswordReset;
const resetPassword = async (resetToken, newPassword) => {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken },
    });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error("Invalid or expired password reset token");
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword },
    });
    await prisma.passwordResetToken.deleteMany({
        where: { userId: tokenRecord.userId },
    });
    return true;
};
exports.resetPassword = resetPassword;
const logoutUser = async (userId, refreshToken, accessToken) => {
    const parts = accessToken.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid access token format");
    }
    const signature = parts[2];
    const decoded = jsonwebtoken_1.default.decode(accessToken);
    if (!decoded || !decoded.exp) {
        throw new Error("Invalid JWT token: cannot decide expiry");
    }
    const expiresAt = new Date(decoded.exp * 1000);
    await prisma.blacklistedToken.create({
        data: {
            token: signature,
            userId: parseInt(userId),
            expiresAt: expiresAt,
            reason: "logout",
        },
    });
    await prisma.refreshToken.deleteMany({
        where: { userId: parseInt(userId), token: refreshToken },
    });
    return { success: true };
};
exports.logoutUser = logoutUser;
const logoutAllDevices = async (userId) => {
    await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { tokenVersion: { increment: 1 } },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: parseInt(userId) } });
    return { success: true };
};
exports.logoutAllDevices = logoutAllDevices;
