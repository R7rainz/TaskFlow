import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  forgotPassword,
  resetPasswordController,
} from "../../controllers/authController";
import { authenticate } from "../../middleware/authMiddleware";
import {
  validatePassword,
  validateResetPassword,
} from "../../validators/passwordValidation";
import {
  apiLimiter,
  authLimiter,
  loginLimiter,
  refreshLimiter,
} from "../../middleware/rateLimiter";
import twoFactorRoutes from "./twoFactorRoutes";

export const router = Router();

router.use("/2fa", twoFactorRoutes);

router.post("/signup", validatePassword, register);
router.post("/signin", loginLimiter, login);

// Protected route
router.get("/profile", apiLimiter, authenticate, (req, res) => {
  res.json({
    message: "This is protected data!",
    user: (req as any).user, // You'll need to attach this in middleware
  });
});

router.post("/refresh", refreshLimiter, refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post(
  "/reset-password",
  authLimiter,
  validateResetPassword,
  resetPasswordController,
);
