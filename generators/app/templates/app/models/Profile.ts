
import * as DataTypes from 'sequelize';
import { db } from './../db';

export const Profile = db.define('profile', {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  time_zone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  locale: {
    type: DataTypes.ENUM('en', 'es'),
    allowNull: true
  }
});
