"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetEmail = sendResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
async function sendResetEmail(email, resetToken) {
    try {
        const resetLink = `https://localhost:8000/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
        };
        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to", email);
    }
    catch (error) {
        console.error("Failed to send email : ", error);
        throw new Error("Failed to send reset email");
    }
}
