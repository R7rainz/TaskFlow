import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generate/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  //checking if the email already exists in the database
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User Already Exists");

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) throw new Error("User not found, please register");

  //checking if password is valid (the password is what we get from the body the user.password is from the database obv)
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid password");

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

  const refreshTokenValue = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt,
      },
    });
  } catch (err) {
    throw new Error("Failed to create refresh token");
  }

  const token = jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    jwtSecret,
    {
      expiresIn: "15m",
    },
  );

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
    refreshToken: refreshTokenValue,
  };
};

export const refresh = async (refreshToken: string) => {
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
  const newAccessToken = jwt.sign(
    { userId: storedToken.userId, tokenVersion: user.tokenVersion },
    jwtSecret,
    {
      expiresIn: "15m",
    },
  );

  return {
    accessToken: newAccessToken,
    refreshToken: refreshToken,
  };
};

export const initiatePasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User with this email does not exist");
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
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

export const resetPassword = async (
  resetToken: string,
  newPassword: string,
) => {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: resetToken },
  });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new Error("Invalid or expired password reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.deleteMany({
    where: { userId: tokenRecord.userId },
  });

  return true;
};

export const logoutUser = async (
  userId: string,
  refreshToken: string,
  accessToken: string,
) => {
  const parts = accessToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid access token format");
  }
  const signature = parts[2];

  const decoded = jwt.decode(accessToken) as { exp: number } | null;

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

export const logoutAllDevices = async (userId: string) => {
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { tokenVersion: { increment: 1 } },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: parseInt(userId) } });

  return { success: true };
};
