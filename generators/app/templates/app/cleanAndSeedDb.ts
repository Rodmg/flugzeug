require("dotenv").config();
import { setupDBClearData } from "@/db";
import { log } from "@/libraries/Log";
import { seed } from "@/seedData";

async function main(): Promise<void> {
  try {
    await setupDBClearData();
    await seed();
    log.info("SEED DONE");
    process.exit();
  } catch (err) {
    log.error("ERROR EXECUTING SEED:", err.message);
    process.exit();
  }
}

main();
