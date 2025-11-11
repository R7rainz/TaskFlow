import cron from "node-cron";
import { PrismaClient } from "../../generate/prisma";

const prisma = new PrismaClient();

export const startScheduleJobs = () => {
  cron.schedule("0 */6 * * *", async () => {
    try {
      console.log("Running scheduled cleanup of expired blacklisted tokens...");

      await prisma.$executeRaw`SELECT clean_expired_blacklisted_tokens()`;

      console.log("Cleanup completed successfully");
    } catch (error) {
      console.error("Scheduled cleanup failed", error);
    }
  });

  console.log("Scheduled jobs started: Token cleanup every 6 hours");
};
