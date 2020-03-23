require("dotenv").config();
import { printDBCreateSQL } from "@/db";

printDBCreateSQL().then(() => {
  process.exit();
});
