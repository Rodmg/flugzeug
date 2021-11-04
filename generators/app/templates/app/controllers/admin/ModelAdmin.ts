import { BaseController, handleServerError } from "@/libraries/BaseController";
import { parseLimit, parseOffset } from "@/libraries/ModelController";
import { Controller, Get } from "@/libraries/routes/decorators";
const importedCtrlsAdmin = require("require-dir-all")("../admin");
import { Request, Response } from "express";
@Controller("model")
class ModelAdmin extends BaseController {
  private modelAdminList: string[];
  constructor() {
    super();
    this.generateModelList();
  }
  @Get("/")
  getRoutes = (req: Request, res: Response) => {
    this.handleGetRoutes(req, res);
  };

  handleGetRoutes(req: Request, res: Response) {
    try {
      const limit = parseLimit(req);
      const offset = parseOffset(req);
      const count = this.modelAdminList.length;
      const result = this.paginate(this.modelAdminList, limit, offset);
      BaseController.ok(res, result, {
        count,
        limit,
        offset,
      });
    } catch (err) {
      handleServerError(err, res);
    }
  }
  private paginate(array, limit, offset) {
    return array.slice(limit * offset, limit * (offset + 1));
  }
  private generateModelList() {
    if (!this.modelAdminList) {
      this.modelAdminList = Object.keys(importedCtrlsAdmin).map((k) => {
        return importedCtrlsAdmin[k].default.name;
      });
    }
  }
}
const controller = new ModelAdmin();

export default controller;
