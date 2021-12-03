import { writeFileSync } from "fs";
const sequelizeErd = require('sequelize-erd');
import { db } from "@/db";
import path from "path";

(async function(){
  const DB_DOCUMENTATION_DIR = path.join(__dirname, "../../../app/documentation");
  const svg = await sequelizeErd({ source: db });
  writeFileSync(path.join(DB_DOCUMENTATION_DIR, `dbDiagram.svg`), svg);
})();