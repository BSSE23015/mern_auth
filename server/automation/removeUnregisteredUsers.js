import cron from "node-cron";
import { User } from "../models/userModel.js";

export const removeUnverifiedUsers = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      await User.deleteMany({
        accountVerified: false,
        createdAt: { $lt: thirtyMinutesAgo },
      });

      console.log("Unverified users cleaned up successfully!");
    } catch (error) {
      console.log("Error removing unverified users:", error);
    }
  });
};
