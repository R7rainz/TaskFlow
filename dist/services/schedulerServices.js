"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduleJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../../generate/prisma");
const prisma = new prisma_1.PrismaClient();
const startScheduleJobs = () => {
    node_cron_1.default.schedule("0 */6 * * *", async () => {
        try {
            console.log("Running scheduled cleanup of expired blacklisted tokens...");
            await prisma.$executeRaw `SELECT clean_expired_blacklisted_tokens()`;
            console.log("Cleanup completed successfully");
        }
        catch (error) {
            console.error("Scheduled cleanup failed", error);
        }
    });
    console.log("Scheduled jobs started: Token cleanup every 6 hours");
};
exports.startScheduleJobs = startScheduleJobs;
