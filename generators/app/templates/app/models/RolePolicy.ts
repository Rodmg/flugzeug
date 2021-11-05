import { Table, Column, DataType, ForeignKey } from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { Role } from "@/models/Role";
import { Policy } from "@/models/Policy";

@Table({
  tableName: "role_policy",
})
export class RolePolicy extends BaseModel<RolePolicy> {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId: number;

  @ForeignKey(() => Policy)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  policyId: number;
}
