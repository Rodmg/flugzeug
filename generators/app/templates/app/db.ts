
import { Sequelize, ISequelizeConfig } from 'sequelize-typescript';
import { log } from './libraries/Log';
import * as _ from 'lodash';
import { config } from './config/config';
import * as path from 'path';

const dbOptions: ISequelizeConfig = {
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  dialect: config.db.dialect,
  logging: config.db.logging,
  storage: config.db.storage,
  timezone: config.db.timezone,
  modelPaths: [path.join(__dirname, '/models')],
  define: {
    freezeTableName: true
  },
  operatorsAliases: {
    $eq: Sequelize.Op.eq,
    $ne: Sequelize.Op.ne,
    $gte: Sequelize.Op.gte,
    $gt: Sequelize.Op.gt,
    $lte: Sequelize.Op.lte,
    $lt: Sequelize.Op.lt,
    $not: Sequelize.Op.not,
    $in: Sequelize.Op.in,
    $notIn: Sequelize.Op.notIn,
    $is: Sequelize.Op.is,
    $like: Sequelize.Op.like,
    $notLike: Sequelize.Op.notLike,
    $iLike: Sequelize.Op.iLike,
    $notILike: Sequelize.Op.notILike,
    $regexp: Sequelize.Op.regexp,
    $notRegexp: Sequelize.Op.notRegexp,
    $iRegexp: Sequelize.Op.iRegexp,
    $notIRegexp: Sequelize.Op.notIRegexp,
    $between: Sequelize.Op.between,
    $notBetween: Sequelize.Op.notBetween,
    $overlap: Sequelize.Op.overlap,
    $contains: Sequelize.Op.contains,
    $contained: Sequelize.Op.contained,
    $adjacent: Sequelize.Op.adjacent,
    $strictLeft: Sequelize.Op.strictLeft,
    $strictRight: Sequelize.Op.strictRight,
    $noExtendRight: Sequelize.Op.noExtendRight,
    $noExtendLeft: Sequelize.Op.noExtendLeft,
    $and: Sequelize.Op.and,
    $or: Sequelize.Op.or,
    $any: Sequelize.Op.any,
    $all: Sequelize.Op.all,
    $values: Sequelize.Op.values,
    $col: Sequelize.Op.col
  }
};

// dbOptions = _.merge(dbOptions, config.db.options);
export const db = new Sequelize(dbOptions);

// Should be called in server
export function setupDB(): Promise<any> {
  // Uncomment parameter for logging CREATE TABLE queries
  return Promise.resolve(db.sync(/*{ logging: console.log }*/));
}