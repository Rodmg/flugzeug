import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import {
  ApiDocs,
  ResponseRequired,
  RequestRequired,
  UpdateRequired,
} from "flugzeug";
import { BaseModel } from "@/libraries/BaseModel";

<% if (belongsToUser) { %>import { User } from "./User";<% } %>
@ApiDocs(true)
@Table({
  tableName: "<%- tableName %>",
})
export class <%- modelName %> extends BaseModel<<%- modelName %>> {
  @ResponseRequired(true)
  @RequestRequired(true)
  @UpdateRequired(true)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;
<% if (belongsToUser) { %>
  @RequestRequired(false)
  @UpdateRequired(false)
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;
<% } %>
}
