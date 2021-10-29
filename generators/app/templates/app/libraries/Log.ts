import winston from "winston";
import fs from "fs";
import path from "path";
import { config } from "@/config";

// Setting up logger
export const log = new winston.Logger();
export const requestLog = new winston.Logger();

// A console transport logging debug and above.
log.add(winston.transports.Console, {
  level: config.log.level,
  colorize: true,
  timestamp: true,
});

requestLog.add(winston.transports.Console, {
  level: config.log.level,
  colorize: true,
  timestamp: true,
});

// Log to file setup
if (config.log.logToFiles) {
  const logDir = path.join(process.env.HOME, ".notes-app-logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // A file based transport logging only errors formatted as json.
  log.add(winston.transports.File, {
    name: "error-file",
    level: "error",
    filename: path.join(logDir, "notes-app-error.log"),
    json: true,
  });

  log.add(winston.transports.File, {
    name: "warn-file",
    level: "warn",
    filename: path.join(logDir, "notes-app-warn.log"),
    json: true,
  });

  log.add(winston.transports.File, {
    name: "debug-file",
    level: "debug",
    filename: path.join(logDir, "notes-app-debug.log"),
    json: true,
  });

  requestLog.add(winston.transports.File, {
    name: "request-file",
    level: "info",
    filename: path.join(logDir, "notes-app-requests.log"),
    json: true,
  });
}

export const requestLogStream: any = {
  write: function(message) {
    requestLog.info(message.trim());
  },
};
