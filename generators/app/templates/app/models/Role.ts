import {
  Table,
  Column,
  DataType,
  HasMany,
  BelongsToMany,
} from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { Policy } from "@/models/Policy";
import { RolePolicy } from "@/models/RolePolicy";
import { UserRole } from "@/models/UserRole";
import { User } from "@/models/User";

@Table({
  tableName: "role",
})
export class Role extends BaseModel<Role> {
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
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isDefault: boolean;

  @HasMany(() => RolePolicy, {
    hooks: true,
    onDelete: "CASCADE",
  })
  rolePolicies: RolePolicy[];

  @BelongsToMany(() => Policy, {
    through: {
      model: () => RolePolicy,
      unique: false,
    },
    constraints: false,
  })
  policies: Policy[];

  @HasMany(() => UserRole, {
    hooks: true,
    onDelete: "CASCADE",
  })
  userRoles: UserRole[];

  @BelongsToMany(() => User, {
    through: {
      model: () => UserRole,
      unique: false,
    },
    constraints: false,
  })
  users: User[];

  addPolicy(policyId: number): Promise<void> {
    return RolePolicy.create({
      roleId: this.id,
      policyId,
    }).then(() => {
      return null;
    });
  }
}
