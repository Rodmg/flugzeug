import { Table, Column, DataType, ForeignKey } from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { User } from "@/models/User";
import { Role } from "@/models/Role";

@Table({
  tableName: "user_role",
})
export class UserRole extends BaseModel<UserRole> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId: number;
}
