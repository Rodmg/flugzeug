
import {
  Table,
  Column,
  HasOne,
  DataType,
  BelongsTo,
  BeforeBulkCreate,
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  BeforeBulkUpdate,
  ForeignKey,
  BeforeDelete,
  HasMany
} from 'sequelize-typescript';
import { BaseModel } from '../libraries/BaseModel';
import { Profile } from './Profile';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';

@Table({
  tableName: 'user'
})
export class User extends BaseModel<User> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isLength: {
        min: 8
      }
    }
  })
  password: string;

  @Column({
    type: DataType.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  })
  role: 'user' | 'admin';

  @HasOne(() => Profile, {
    hooks: true,
    onDelete: 'CASCADE'
  })
  profile: Profile;

  @BeforeBulkCreate
  @BeforeBulkUpdate
  static activateIndividualHooks(items: Array<User>, options: any) {
    options.individualHooks = true;
  }

  @BeforeCreate
  static addPassword(user: User, options: any) {
    return user.updatePassword()
  }

  @AfterCreate
  static createProfile(user: User, options: any) {
    return user.addProfile()
  }

  @BeforeUpdate
  static changePassword(user: User, options: any) {
    if(user.changed('password')) {
      return user.updatePassword()
    }
    return Promise.resolve();
  }

  @BeforeDelete
  static deleteChilds(user: User, options: any) {
    return Promise.all([
      Profile.destroy({where: {userId: user.id}}),
    ]);
  }

  authenticate(password:string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  hashPassword(password:string): Promise<string> {
    if(password == null || password.length < 8) throw new Error('Invalid password');
    return bcrypt.hash(password, 10);
  }

  updatePassword(): Promise<void> {
    return this.hashPassword(this.password)
    .then((result) => {
      this.password = result;
      return null;
    });
  }

  addProfile(): Promise<void> {
    return Promise.resolve(
      Profile.create({
        time_zone: 'America/Mexico_City',
        userId: this.id,
        locale: 'es'  // Defaults, this should be changed in auth controller on register.
      })
      .then(result => {
        return null;
      })
    );
  } 

  toJSON() {
    let object = super.toJSON();
    delete object.role;
    delete object.password;
    delete object.createdAt;
    delete object.updatedAt;
    return object;
  }

}
