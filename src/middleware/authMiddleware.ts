import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generate/prisma";
import { JwtPayload } from "../types/types";

const prisma = new PrismaClient();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    const decoded = jwt.verify(token, jwtsecret) as JwtPayload;
    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid token" });
    }
    (req as any).user = decoded;

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true },
    });
    if (!dbUser || dbUser.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
