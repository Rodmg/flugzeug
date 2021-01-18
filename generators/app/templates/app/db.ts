import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import { config } from "@/config";
import path from "path";

const dbOptions: SequelizeOptions = {
  ...config.db,
  modelPaths: [path.join(__dirname, "/models")],
  define: {
    freezeTableName: true,
    timestamps: true,
  },
};

export const db = new Sequelize(dbOptions);

// Should be called in server
export function setupDB(): Promise<any> {
  return db.sync();
}

export function setupDBClearData(): Promise<any> {
  return db.sync({
    force: true,
  });
}

export function setupDBAlterSchema(): Promise<any> {
  return db.sync({
    alter: true,
  });
}

export function printDBCreateSQL(): Promise<any> {
  return db.sync({
    logging: data => {
      // Clean output
      data = data.replace("Executing (default): ", "");
      if (data.indexOf("SHOW INDEX FROM") != -1) return;
      console.log(data);
    },
  });
}
