import {
  BaseController,
  handleServerError,
  ControllerErrors,
} from "@/libraries/BaseController";
import { parseLimit, parseOffset } from "@/libraries/ModelController";
import {
  Authentication,
  Controller,
  Get,
  Middlewares,
} from "flugzeug";
import { hasAdminAccess } from "@/policies/Authorization";
const importedCtrlsAdmin = require("require-dir-all")("../admin");
import { Request, Response } from "express";
import _ from "lodash";
import { log } from "@/libraries/Log";
@Controller("model")
@Authentication()
@Middlewares([hasAdminAccess()])
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
      const order = this.parseOrder(req);
      const count = this.modelAdminList.length;

      const modelAdminList = order
        ? this.sort(this.modelAdminList, order)
        : this.modelAdminList;
      const result = this.paginate(modelAdminList, limit, offset);

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
  private sort(array: string[], order: any): string[] {
    const ORDERS = {
      DESC: function (a, b) {
        if (a > b) return -1;
        if (b > a) return 1;
        return 0;
      },
      ASC: function (a, b) {
        if (a > b) return 1;
        if (b > a) return -1;
        return 0;
      },
    };
    return array.sort(ORDERS[order]);
  }
  private generateModelList() {
    if (!this.modelAdminList) {
      this.modelAdminList = Object.keys(importedCtrlsAdmin).map((k) => {
        return importedCtrlsAdmin[k].default.name;
      });
    }
  }
  private parseOrder(req): string {
    try {
      let sort: any = req.query.order || req.query.sort;
      if (sort === undefined) {
        return undefined;
      }
      try {
        if (_.isString(sort)) {
          if (sort !== "ASC" && sort !== "DESC")
            throw new Error("invalid query");
        }
        //invalid
      } catch (err) {
        sort = false;
      }
      return sort;
    } catch (err) {
      log.error("Error on parseOrder:", err);
      throw ControllerErrors.BAD_REQUEST;
    }
  }
}
const controller = new ModelAdmin();

export default controller;
