import { Table, Column, DataType, HasMany } from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { RolePolicy } from "@/models/RolePolicy";

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
  permission: JSON;

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
