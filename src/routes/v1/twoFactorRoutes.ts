import { Router } from "express";
import {
  setup2FAController,
  verify2FAWithOTPController,
  verify2FAWithBackupCodeController,
  verifyLoginWithOTPController,
} from "../../controllers/2FAController";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/setup", authenticate, setup2FAController);
router.post("/verify-otp", authenticate, verify2FAWithOTPController);
router.post("/verify-backup", authenticate, verify2FAWithBackupCodeController);
router.post("/verify-2fa-login", verifyLoginWithOTPController);

export default router;
