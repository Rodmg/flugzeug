require("dotenv").config();
import { setupDB } from "@/db";
import { log } from "@/libraries/Log";
import { User } from "@/models/User";

async function seed(): Promise<void> {
  // Do your seed code here.

  // Creates first admin user
  const count = await User.count();
  if (count === 0) {
    await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "adminadmin",
      role: "admin",
    });
  }
}

async function main(): Promise<void> {
  try {
    await setupDB();
    await seed();
    log.info("SEED DONE");
    process.exit();
  } catch (err) {
    log.error("ERROR EXECUTING SEED:", err);
    process.exit();
  }
}

main();
