import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refresh,
  initiatePasswordReset,
  resetPassword,
  logoutUser,
} from "../services/authServices";
import { sendResetEmail } from "../services/emailService";
//register function first
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;
    const newUser = await registerUser(name, email, password);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

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
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken, userId } = req.body;
    const newTokens = await refresh(userId, refreshToken);
    res.json(newTokens);
  } catch (err) {
    next(err);
  }
};

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

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const resetToken = await initiatePasswordReset(email);
    await sendResetEmail(email, resetToken);
    res.status(200).json({
      message: "Reset instructions sent",
      resetToken: resetToken, // Return for testing
    });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;
    await resetPassword(token, newPassword);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or malformed" });
    }

    const accessToken = authHeader.substring(7);
    const userId = (req as any).user.userId;
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ message: "Refresh token is required for logout" });
    }

    const result = await logoutUser(userId, refreshToken, accessToken);
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    next(err);
  }
};
