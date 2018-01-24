
import { Table, Column, DataType, BelongsTo, Model, ForeignKey } from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'profile'
})
export class Profile extends Model<Profile> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  time_zone: string;

  @Column({
    type: DataType.ENUM('en', 'es'),
    allowNull: true
  })
  locale: 'en' | 'es';

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

}
