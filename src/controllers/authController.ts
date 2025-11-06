import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refresh,
  initiatePasswordReset,
  resetPassword,
} from "../services/authServices";
import { sendResetEmail } from "../services/emailService";
//register function first
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const { token, user, refreshToken } = await loginUser(email, password);
    res.status(201).json({
      message: "User logged in successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email },
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
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
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    await resetPassword(token, newPassword);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
};
