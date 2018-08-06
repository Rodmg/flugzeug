import { Table, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";

@Table({
  tableName: "jwtblacklist"
})
export class JWTBlacklist extends BaseModel<JWTBlacklist> {
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
