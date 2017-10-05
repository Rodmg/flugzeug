
import * as DataTypes from 'sequelize';
import { db } from './../db';
import { Profile } from './Profile';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';

export const User = db.define('user', {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isLength: {
        min: 8
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  }
}, {
  classMethods: {
    getAssociations: () => {
      return {
        profile: {
          type: 'hasOne',
          model: Profile,
          as: 'profile',
          hooks: true,
          onDelete: 'cascade'
        }
      }
    }
  },
  // Instance methods for managing auth
  instanceMethods: {

    authenticate: function(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password)
        .then((result) => {
          return result;
        });
    },

    hashPassword: function(password: string): Promise<string> {
      if(password == null || password.length < 8) throw new Error('Invalid password');
      return bcrypt.hash(password, 10)
        .then((result) => {
          return result;
        });
    },

    updatePassword: function(): Promise<void> {
      return this.hashPassword(this.password)
        .then((result) => {
          this.password = result;
          return null;
        });
    },

    addProfile: function(): Promise<void> {
      return Promise.resolve(
          Profile.create({
            time_zone: 'America/Mexico_City',
            notification_email: this.email,
            userId: this.id,
            locale: 'es'  // Defaults, this should be changed in auth controller on register.
          })
          .then(result => {
            return null;
          })
        );
    },

    toJSON() {
      let object = _.clone(this.dataValues);
      delete object.role;
      delete object.password;
      delete object.createdAt;
      delete object.updatedAt;
      return object;
    }

  },
  // Pre save hooks
  hooks: {
    beforeBulkCreate(items: Array<any>, options: any, fn: Function) {
      options.individualHooks = true;
      fn();
    },
    beforeCreate(user: any, options: any, fn: Function) {
      user.updatePassword()
        .then(() => {
          fn();
        })
        .catch(err => {
          fn(err);
        });
    },
    afterCreate(user: any, options: any, fn: Function) {
      user.addProfile()
        .then(() => {
          fn();
        })
        .catch(err => {
          fn(err);
        });
    },
    beforeUpdate(user: any, options: any, fn: Function) {
      if(user.changed('password')) {
        return user.updatePassword()
        .then(() => {
          fn();
        })
        .catch(err => {
          fn(err);
        });
      }
      fn();
    },
    beforeBulkUpdate(options: any, fn: Function) {
      options.individualHooks = true;
      fn();
    }
  }

});
