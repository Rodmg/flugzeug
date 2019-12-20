import { Model } from "sequelize-typescript";
import { Request, Response, Router } from "express";
import { log } from "./Log";
import { db } from "./../db";
import { config } from "./../config/config";
import * as _ from "lodash";

export class Controller {
  protected model: typeof Model | any;
  public name: string; // Name used for the route, all lowercase
  protected router: Router;

  constructor() {
    this.router = Router();
    // Initialize req.session
    this.router.use(function(req: Request, res: Response, next) {
      if (req.session == null) req.session = {};
      next();
    });
  }

  routes(): Router {
    // Example routes
    // WARNING: Routes without policies
    // You should add policies before your method
    log.warn("You should add policies before your method");
    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.post("/", (req, res) => this.create(req, res));
    this.router.put("/:id", (req, res) => this.update(req, res));
    this.router.delete("/:id", (req, res) => this.destroy(req, res));

    return this.router;
  }

  // Sails query format retrocompatibility
  protected parseWhereSails(where: any): any {
    function recursiveParse(obj: any) {
      _.each(obj, (val: any, key: any) => {
        if (_.isObjectLike(val)) return recursiveParse(val);
        if (_.isString(val) || _.isNumber(val)) {
          if (key === "contains") {
            obj["$like"] = `%${val}%`;
            delete obj[key];
          }
          if (key === "startsWith") {
            obj["$like"] = `${val}%`;
            delete obj[key];
          }
          if (key === "endsWith") {
            obj["$like"] = `%${val}`;
            delete obj[key];
          }
          if (key === "!") {
            obj["$not"] = val;
            delete obj[key];
          }
          if (key === "or") {
            obj["$or"] = val;
            delete obj[key];
          }
          if (key === "<") {
            obj["$lt"] = val;
            delete obj[key];
          }
          if (key === "<=") {
            obj["$lte"] = val;
            delete obj[key];
          }
          if (key === ">") {
            obj["$gt"] = val;
            delete obj[key];
          }
          if (key === ">=") {
            obj["$gte"] = val;
            delete obj[key];
          }
          if (key === "like") {
            obj["$like"] = val;
            delete obj[key];
          }
        }
      });
    }

    recursiveParse(where);

    return where;
  }

  protected parseWhere(req: Request): any {
    // Look for explicitly specified `where` parameter.
    let where: any = req.query.where;
    // If `where` parameter is a string, try to interpret it as JSON
    if (_.isString(where)) {
      try {
        where = JSON.parse(where);
      } catch (e) {
        where = null;
      }
    }
    // If `where` has not been specified, but other unbound parameter variables
    // **ARE** specified, build the `where` option using them.
    if (!where) {
      // Prune params which aren't fit to be used as `where` criteria
      // to build a proper where query
      where = req.params;
      // Omit built-in runtime config (like query modifiers)
      where = _.omit(where, ["limit", "skip", "sort"]);
      // Omit any params w/ undefined values
      where = _.omit(where, function(p) {
        if (_.isUndefined(p)) {
          return true;
        }
      } as any);
    }

    // Merge with req.session.where (Useful for enforcing policies)
    if (req.session == null) req.session = {};
    where = _.merge(where, req.session.where || {});

    where = this.parseWhereSails(where);

    // Check `WHERE` clause for unsupported usage.
    // (throws if bad structure is detected)
    //validateWhereClauseStrict(where);

    // Return final `where`.
    return where;
  }

  protected parseLimit(req: Request): number {
    const limit = req.query.limit || config.api.limit;
    const result: number = +limit;
    return result;
  }

  protected parseOffset(req: Request): number {
    const skip = req.query.offset || req.query.skip || config.api.offset;
    const result: number = +skip;
    return result;
  }

  protected parseOrder(req: Request): any {
    let sort = req.query.order || req.query.sort;
    if (_.isUndefined(sort)) {
      return undefined;
    }

    // If `sort` is a string, attempt to JSON.parse() it.
    // (e.g. `{"name": 1}`)
    if (_.isString(sort)) {
      try {
        sort = JSON.parse(sort);
      } catch (e) {
        // If it is not valid JSON, then fall back to interpreting it as-is.
        // (e.g. "name ASC")
        // Put it in array form for avoiding errors with reserved words
        try {
          const parts: Array<string> = sort.split(" ");
          const colName: string = parts[0];
          const orderParam: string = parts[1];
          if (orderParam !== "ASC" && orderParam !== "DESC")
            throw new Error("invalid query");
          sort = [[colName, orderParam]];
        } catch (e) {
          // Invalid string
          sort = "";
        }
      }
    }
    return sort;
  }

  protected parseInclude(req: Request): Array<any> {
    let include: Array<any> = [];
    const populate: any = req.query.include || req.query.populate;

    if (_.isString(populate)) {
      include = JSON.parse(populate);
    }

    const tryWithFilter = (m: string) => {
      if (m.includes(".")) {
        const splt = m.split("."),
          modelName = splt[0],
          filterName = splt[1];

        const model = this.getModelFromList(modelName);

        //return {model: model, where: where, required: false};
        if (model["filter"] != null) {
          return model["filter"](filterName);
        }
      }

      return { model: this.getModelFromList(m), required: false };
    };

    const parseIncludeRecursive = item => {
      if (_.isString(item)) {
        return tryWithFilter(item);
      } else {
        const model: string = Object.keys(item)[0];
        const content = item[model];

        const result: any = tryWithFilter(model);
        result.include = content.map(i => parseIncludeRecursive(i));

        return result;
      }
    };

    return include.map(item => parseIncludeRecursive(item));
  }

  public static ok(res: Response, data?: any) {
    if (data == null) data = "OK";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(200).json(data);
  }

  public static created(res: Response, data?: any) {
    if (data == null) data = "Created";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(201).json(data);
  }

  public static noContent(res: Response) {
    return res.status(204).end();
  }

  public static badRequest(res: Response, data?: any) {
    if (data == null) data = "Bad Request";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(400).json(data);
  }

  public static unauthorized(res: Response, data?: any) {
    if (data == null) data = "Unauthorized";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(401).json(data);
  }

  public static forbidden(res: Response, data?: any) {
    if (data == null) data = "Forbidden";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(403).json(data);
  }

  public static notFound(res: Response, data?: any) {
    if (data == null) data = "Not Found";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(404).json(data);
  }

  public static serverError(res: Response, data?: any) {
    // TODO: consideer option for sending err on debug mode
    log.error(data);
    res.status(500).send("Internal Server Error");
  }

  public static timeout(res: Response, data?: any) {
    if (data == null) data = "Timeout";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(504).json(data);
  }

  create(req: Request, res: Response) {
    const values: any = req.body;
    if (!_.isObject(values))
      return Controller.serverError(res, new Error("Invalid data in body"));
    this.model
      .create(values)
      .then(result => {
        res.status(201).json(result);
        return null;
      })
      .catch(err => {
        if (err) Controller.serverError(res, err);
      });
  }

  destroy(req: Request, res: Response) {
    // For applying constraints (usefull with policies)
    const where = this.parseWhere(req);
    where.id = req.params.id;
    this.model
      .findOne({
        where: where,
      })
      .then(result => {
        if (!result) {
          res.status(404).end();
          throw null;
        }
        return result.destroy();
      })
      .then(result => {
        if (result != null) res.status(204).end();
        return null;
      })
      .catch(err => {
        if (err) Controller.serverError(res, err);
      });
  }

  find(req: Request, res: Response) {
    this.model
      .findAndCountAll({
        where: this.parseWhere(req),
        limit: this.parseLimit(req),
        offset: this.parseOffset(req),
        order: this.parseOrder(req),
        include: this.parseInclude(req),
      })
      .then(result => {
        res.set("Content-Count", String(result.count));
        res.status(200).json(result.rows);
        return null;
      })
      .catch(err => {
        if (err) Controller.serverError(res, err);
      });
  }

  findOne(req: Request, res: Response) {
    // For applying constraints (usefull with policies)
    const where = this.parseWhere(req);
    where.id = req.params.id;
    this.model
      .findOne({
        where: where,
        include: this.parseInclude(req),
      })
      .then(result => {
        if (!result) res.status(404).end();
        else res.status(200).json(result);
        return null;
      })
      .catch(err => {
        if (err) Controller.serverError(res, err);
      });
  }

  update(req: Request, res: Response) {
    const id = req.params.id;
    // Get values
    const values: any = req.body;
    if (!_.isObject(values))
      return Controller.serverError(res, new Error("Invalid data in body"));
    // Make sure id is not changed in the values to update
    (values as any).id = id;
    // For applying constraints (usefull with policies)
    const where = this.parseWhere(req);
    where.id = id;
    // Update
    this.model
      .findOne({
        where: where,
        include: this.parseInclude(req),
      })
      .then(result => {
        if (!result) {
          res.status(404).end();
          throw null;
        }
        return result.update(values);
      })
      .then(result => {
        if (!result) res.status(404).end();
        else res.status(200).json(result);
        return null;
      })
      .catch(err => {
        if (err) Controller.serverError(res, err);
      });
  }

  getModel() {
    return this.model;
  }

  getModelFromList(modelName) {
    return db.models[modelName];
  }
}
