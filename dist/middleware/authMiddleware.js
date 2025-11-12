"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../generate/prisma");
const prisma = new prisma_1.PrismaClient();
const authenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }
    // Bearer <token> so the [1] tells we are taking the token from this
    const token = authHeader.split(" ")[1];
    try {
        const signature = token.split(".")[2];
        const blacklisted = await prisma.blacklistedToken.findFirst({
            where: { token: signature, expiresAt: { gt: new Date() } },
        });
        if (blacklisted) {
            return res
                .status(401)
                .json({ message: "Token revoked. Please login again" });
        }
        const jwtsecret = process.env.JWT_SECRET;
        if (!jwtsecret) {
            return res.status(500).json({ message: "JWT secret not configured" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtsecret);
        if (typeof decoded === "string") {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decoded;
        const dbUser = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { tokenVersion: true },
        });
        if (!dbUser || dbUser.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: "Token revoked" });
        }
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.authenticate = authenticate;
