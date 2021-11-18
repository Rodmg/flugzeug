import { ModelController } from "@/libraries/ModelController";
import { Model } from "sequelize";
import { Request, Response } from "express";
import { BaseController, handleServerError } from "@/libraries/BaseController";
import { hasAdminAccess } from "@/policies/Authorization";
import { Get, Put, Delete, Auth, Post } from "@/libraries/routes/decorators";
export class ModelAdminController<T extends Model> extends ModelController<T> {
  protected modelSchema: object;
  @Get("/")
  @Auth([hasAdminAccess()])
  getUsers = (req: Request, res: Response) => {
    this.handleFindAll(req, res);
  };
  @Post("/")
  @Auth([hasAdminAccess()])
  postUser = (req: Request, res: Response) => {
    this.handleCreate(req, res);
  };

  @Get("/schema")
  @Auth([hasAdminAccess()])
  getSchema = (req: Request, res: Response) => {
    this.handleGetSchema(req, res);
  };

  @Get("/:id")
  @Auth([hasAdminAccess()])
  getUser = (req: Request, res: Response) => {
    this.handleFindOne(req, res);
  };

  @Put("/:id")
  @Auth([hasAdminAccess()])
  updateUser = (req: Request, res: Response) => {
    this.handleUpdate(req, res);
  };

  @Delete("/:id")
  @Auth([hasAdminAccess()])
  deleteUser = (req: Request, res: Response) => {
    this.handleDelete(req, res);
  };

  handleGetSchema(req: Request, res: Response) {
    try {
      //only compute schema the first time
      if (!this.modelSchema) {
        this.generateSchema();
      }
      return BaseController.ok(res, this.modelSchema);
    } catch (err) {
      handleServerError(err, res);
    }
  }
  generateSchema() {
    const attributes = this.model.rawAttributes;
    let schema = {};
    Object.keys(attributes).forEach((attribute) => {
      let type = attributes[attribute].type.constructor.name.toLowerCase();
      schema[attribute] = formatSchemaAttribute(type, attribute, attributes);
    });
    this.modelSchema = schema;
  }
}

function formatSchemaAttribute(type, attribute, attributes) {
  return {
    type,
    fieldName: attributes[attribute].field,
    allowNull: attributes[attribute].allowNull,
    values: attributes[attribute].values,
    defaultValue: attributes[attribute].defaultValue,
    validate: attributes[attribute].validate || null,
    references: attributes[attribute].references,
  };
}
