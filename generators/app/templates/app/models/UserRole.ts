import {
  Table,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { User } from "@/models/User";
import { Role } from "@/models/Role";

@Table({
  tableName: "user_role",
})
export class UserRole extends BaseModel<UserRole> {
  @Column({ primaryKey: true })
  id: number;

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
