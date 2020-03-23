import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import { Op } from "sequelize";
import { config } from "@/config/config";
import * as path from "path";

const dbOptions: SequelizeOptions = {
  ...config.db,
  modelPaths: [path.join(__dirname, "/models")],
  define: {
    freezeTableName: true,
    timestamps: true,
  },
  operatorsAliases: {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col,
  },
};

export const db = new Sequelize(dbOptions);

// Should be called in server
export function setupDB(): Promise<any> {
  return Promise.resolve(db.sync());
}

export function printDBCreateSQL(): Promise<any> {
  return Promise.resolve(
    db.sync({
      logging: data => {
        // Clean output
        data = data.replace("Executing (default): ", "");
        if (data.indexOf("SHOW INDEX FROM") != -1) return;
        console.log(data);
      },
    }),
  );
}
