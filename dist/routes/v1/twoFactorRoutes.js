"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const _2FAController_1 = require("../../controllers/2FAController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get("/setup", authMiddleware_1.authenticate, _2FAController_1.setup2FAController);
router.get("/verify", authMiddleware_1.authenticate, _2FAController_1.verifyAndEnable2FAController);
exports.default = router;
