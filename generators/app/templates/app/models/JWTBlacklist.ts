
import * as DataTypes from 'sequelize';
import { db } from './../db';

export const JWTBlacklist = db.define('jwtblacklist', {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
});