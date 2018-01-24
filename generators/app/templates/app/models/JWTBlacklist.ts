
import { Table, Column, DataType, BelongsTo, Model, ForeignKey } from 'sequelize-typescript';

@Table({
  tableName: 'jwtblacklist'
})
export class JWTBlacklist extends Model<JWTBlacklist> {
  
  @Column({
    type: DataType.STRING(512),
    allowNull: false
  })
  token: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null
  })
  expires: Date;
  
}
