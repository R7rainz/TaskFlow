"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authController_1 = require("../../controllers/authController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const passwordValidation_1 = require("../../validators/passwordValidation");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const twoFactorRoutes_1 = __importDefault(require("./twoFactorRoutes"));
exports.router = (0, express_1.Router)();
exports.router.use("/2fa", twoFactorRoutes_1.default);
exports.router.post("/signup", passwordValidation_1.validatePassword, authController_1.register);
exports.router.post("/signin", rateLimiter_1.loginLimiter, authController_1.login);
// Protected route
exports.router.get("/profile", rateLimiter_1.apiLimiter, authMiddleware_1.authenticate, (req, res) => {
    res.json({
        message: "This is protected data!",
        user: req.user, // You'll need to attach this in middleware
    });
});
exports.router.post("/refresh", rateLimiter_1.refreshLimiter, authController_1.refreshToken);
exports.router.post("/forgot-password", rateLimiter_1.authLimiter, authController_1.forgotPassword);
exports.router.post("/reset-password", rateLimiter_1.authLimiter, passwordValidation_1.validateResetPassword, authController_1.resetPasswordController);
