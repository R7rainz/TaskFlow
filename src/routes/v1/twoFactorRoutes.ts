import { Router } from "express";
import {
  setup2FAController,
  verify2FAWithOTPController,
  verify2FAWithBackupCodeController,
  verifyLoginWithOTPController,
  verifyLoginWithBackupController,
} from "../../controllers/2FAController";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/setup", authenticate, setup2FAController);
router.post("/verify-otp", authenticate, verify2FAWithOTPController);
router.post("/verify-backup", authenticate, verify2FAWithBackupCodeController);
router.post("/verify-loginOTP-2fa", verifyLoginWithOTPController);
router.post("/verify-loginbackupCode-2fa", verifyLoginWithBackupController);

export default router;
