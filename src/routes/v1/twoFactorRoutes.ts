import { Router } from "express";
import {
  setup2FAController,
  verify2FAWithOTPController,
  verify2FAWithBackupCodeController,
} from "../../controllers/2FAController";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/setup", authenticate, setup2FAController);
router.get("/verify-otp", authenticate, verify2FAWithOTPController);
router.get("/verify-backup", authenticate, verify2FAWithBackupCodeController);

export default router;
