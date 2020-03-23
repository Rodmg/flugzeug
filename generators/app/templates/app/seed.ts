require("dotenv").config();
import { setupDB } from "@/db";
import { log } from "@/libraries/Log";
import { User } from "@/models/User";

function seed(): PromiseLike<any> {
  // Do your seed code here, should return a promise that resolves whenn you are done.

  // Creates first admin user
  return User.count().then((count: number) => {
    if (count === 0)
      return User.create({
        name: "Admin",
        email: "admin@example.com",
        password: "adminadmin",
        role: "admin",
      });
    return null;
  });
}

setupDB()
  .then(() => {
    return seed();
  })
  .then(() => {
    log.info("SEED DONE");
    process.exit();
  })
  .catch(err => {
    log.error("ERROR EXECUTING SEED:", err);
    process.exit();
  });
