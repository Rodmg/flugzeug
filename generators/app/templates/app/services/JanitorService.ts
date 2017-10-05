/*
  JanitorService
    Manages periodical cleanup of DB according to business rules

  Business logic:
    Delete templog older than 30 days each 24h
    Delete userlog older than 30 days each 24h
    Cleanup never connected devices after 24h
    Cleanup expired blacklisted tokens each 24h
*/

import * as cron from 'node-cron';
import { log } from './../libraries/Log';
import { JWTBlacklist } from './../models/JWTBlacklist';

class JanitorService {

  constructor() {
  }

  init() {
    // Every day at 0:00
    cron.schedule('0 0 * * *', () => {

      let today = new Date();
      let hour = 60*60*1000;
      let day = 24*hour;
      let days30ago = new Date(today.getTime() - 30*day);
      let hours1ago = new Date(today.getTime() - 1*hour);
      // Cleanup expired blacklisted tokens each 24h
      JWTBlacklist.destroy({ where: { expires: { $lt: today } } })
      .catch(err => {
        if(err) return log.error('Jaintor error:', err);
      });

    });
  }

}

const janitorService = new JanitorService();
export default janitorService;
