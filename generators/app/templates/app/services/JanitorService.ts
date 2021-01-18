/*
  JanitorService
    Manages periodical cleanup of DB according to business rules

  Business logic:
    Cleanup expired blacklisted tokens each 24h
*/

import cron from "node-cron";
import { log } from "@/libraries/Log";
import { JWTBlacklist } from "@/models/JWTBlacklist";
import { Op } from "sequelize";

class JanitorService {
  init() {
    // Every day at 0:00
    cron.schedule("0 0 * * *", () => {
      const today = new Date();
      // Useful variables:
      // const hour = 60 * 60 * 1000;
      // const day = 24 * hour;
      // const days30ago = new Date(today.getTime() - 30 * day);
      // const hours1ago = new Date(today.getTime() - 1 * hour);

      // Cleanup expired blacklisted tokens each 24h
      JWTBlacklist.destroy({ where: { expires: { [Op.lt]: today } } }).catch(
        err => {
          if (err) return log.error("Jaintor error:", err);
        },
      );
    });
  }
}

const janitorService = new JanitorService();
export default janitorService;
