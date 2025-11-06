"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = exports.forgotPassword = exports.refreshToken = exports.login = exports.register = void 0;
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
        const { token, user, refreshToken } = await (0, authServices_1.loginUser)(email, password);
        res.status(201).json({
            message: "User logged in successfully",
            token,
            user: { id: user.id, name: user.name, email: user.email },
            refreshToken,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken, userId } = req.body;
        const newTokens = await (0, authServices_1.refresh)(userId, refreshToken);
        res.json(newTokens);
    }
    catch (err) {
        next(err);
    }
};
exports.refreshToken = refreshToken;
// export const forgotPassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { email } = req.body;
//     await initiatePasswordReset(email);
//     res.status(200).json({ message: "Password reset email sent" });
//   } catch (err) {
//     next(err);
//   }
// };
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
