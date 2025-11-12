"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAllDevicesController = exports.logoutController = exports.resetPasswordController = exports.forgotPassword = exports.refreshToken = exports.login = exports.register = void 0;
const authServices_1 = require("../services/authServices");
const emailService_1 = require("../services/emailService");
//register function first
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const newUser = await (0, authServices_1.registerUser)(name, email, password);
        res.status(201).json({
            message: "User registered successfully",
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await (0, authServices_1.loginUser)(email, password);
        if (result.requires2FA) {
            return res.status(200).json({
                message: "Two-factor authentication required",
                requires2Fa: true,
                userId: result.userId,
            });
        }
        const user = result.user;
        if (!user) {
            const err = new Error("User data missing from login result");
            return next(err);
        }
        res.status(200).json({
            message: "User logged in successfully",
            token: result.token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            refreshToken: result.refreshToken,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const newTokens = await (0, authServices_1.refresh)(refreshToken);
        res.json(newTokens);
    }
    catch (err) {
        next(err);
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const resetToken = await (0, authServices_1.initiatePasswordReset)(email);
        await (0, emailService_1.sendResetEmail)(email, resetToken);
        res.status(200).json({
            message: "Reset instructions sent",
            resetToken: resetToken, // Return for testing
        });
    }
    catch (err) {
        next(err);
    }
};
exports.forgotPassword = forgotPassword;
const resetPasswordController = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await (0, authServices_1.resetPassword)(token, newPassword);
        res.status(200).json({ message: "Password has been reset successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.resetPasswordController = resetPasswordController;
const logoutController = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res
                .status(401)
                .json({ message: "Authorization header missing or malformed" });
        }
        const accessToken = authHeader.substring(7);
        const userId = req.user.userId;
        const refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            return res
                .status(400)
                .json({ message: "Refresh token is required for logout" });
        }
        await (0, authServices_1.logoutUser)(userId.toString(), refreshToken, accessToken);
        res.status(200).json({ message: "User logged out successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.logoutController = logoutController;
const logoutAllDevicesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await (0, authServices_1.logoutAllDevices)(userId.toString());
        res
            .status(200)
            .json({ message: "Logged out from all devices successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.logoutAllDevicesController = logoutAllDevicesController;
