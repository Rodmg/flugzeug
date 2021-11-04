import { Table, Column, DataType, HasMany } from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { RolePolicy } from "@/models/RolePolicy";

export interface PermissionData {
  [key: string]: boolean;
}

@Table({
  tableName: "policy",
})
export class Policy extends BaseModel<Policy> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  permission: PermissionData;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isSystemManaged: boolean;

  @HasMany(() => RolePolicy, {
    hooks: true,
    onDelete: "CASCADE",
  })
  rolePolicies: RolePolicy[];
}
