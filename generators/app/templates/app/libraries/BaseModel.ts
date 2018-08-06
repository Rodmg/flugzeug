import { Model } from "sequelize-typescript";

/* 
  BaseModel: 
  All models inherit from this class, 
  modify it to apply defaults to all your models.
*/

export class BaseModel<T> extends Model<T> {
  toJSON() {
    return super.toJSON();
  }
}
