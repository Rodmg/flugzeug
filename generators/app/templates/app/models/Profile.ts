
import * as DataTypes from 'sequelize';
import { db } from './../db';

export const Profile = db.define('profile', {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  advanced_user: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  sound: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notify_via_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notify_via_push: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notify_errors: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  notify_task: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  notify_disconnect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  notify_connect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  time_zone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  notification_email: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      isEmail: true
    }
  },
  locale: {
    type: DataTypes.ENUM('en', 'es'),
    allowNull: true
  }
});
