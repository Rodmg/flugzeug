import { Request, Response, Router } from "express";
import { validateJWT } from "@/policies/General";
import { log } from "./Log";
import _ from "lodash";
import {
  getRouteMetaData,
  isRoute,
  HttpMethod,
  getAuthMetaData,
  getMiddlewares,
} from "@/libraries/routes/decorators";

export enum ControllerErrors {
  NOT_FOUND,
  BAD_REQUEST,
  UNKNOWN_ERROR,
}

export function parseId(req: Request): number {
  return parseInt(req.params.id);
}

export function parseBody(req: Request): any {
  const body = req.body;
  if (!_.isObject(body)) {
    throw ControllerErrors.UNKNOWN_ERROR;
  }
  return body;
}

export class BaseController {
  public name: string; // Name used for the route, all lowercase
  protected router: Router;

  constructor() {
    this.router = Router();
    // Initialize req.session
    this.router.use(function (req: Request, res: Response, next) {
      if (req.session == null) req.session = {};
      next();
    });
  }

  routes(): Router {
    //iterate through all numerable properties
    for (const property in this) {
      if (isRoute(this, property)) {
        const isAuthRequired = getAuthMetaData(this, property);

        let functionsChain: Array<Function> = [];

        //middlewares config

        if (isAuthRequired) {
          functionsChain.push(validateJWT("access"));
        }

        functionsChain.push(getMiddlewares(this, property));

        //@ts-ignore
        functionsChain.push(this[property]);

        // route config
        const routeConfig = getRouteMetaData(this, property);
        switch (routeConfig.httpMethod) {
          case HttpMethod.GET:
            //@ts-ignore
            this.router.get(routeConfig.path, functionsChain);
            break;
          case HttpMethod.POST:
            //@ts-ignore
            this.router.post(routeConfig.path, functionsChain);
            break;
          case HttpMethod.PUT:
            //@ts-ignore
            this.router.put(routeConfig.path, functionsChain);
            break;
          case HttpMethod.DELETE:
            //@ts-ignore
            this.router.delete(routeConfig.path, functionsChain);
            break;
          default:
            break;
        }
      }
    }
    return this.router;
  }

  public static ok(res: Response, data?: any, metadata?: any) {
    const message = "Ok";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(200).json({ message, ...metadata, data });
  }

  public static created(res: Response, data?: any, metadata?: any) {
    const message = "Created";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(201).json({ message, ...metadata, data });
  }

  public static accepted(res: Response) {
    const message = "Accepted";
    return res.status(202).end({ message });
  }

  public static noContent(res: Response) {
    return res.status(204).end();
  }

  public static badRequest(res: Response, data?: any) {
    const message = "Bad Request";
    if (Buffer.isBuffer(data)) data = data.toString();
    return res.status(400).json({ message, data });
  }

  public static unauthorized(res: Response, data?: any) {
    const message = "Unauthorized";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(401).json({ message, data });
  }

  public static forbidden(res: Response, data?: any) {
    const message = "Forbidden";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(403).json({ message, data });
  }

  public static notFound(res: Response, data?: any) {
    const message = "Not Found";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(404).json({ message, data });
  }

  public static conflict(res: Response, data?: any) {
    const message = "Conflict";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(409).json({ message, data });
  }

  public static serverError(res: Response, data?: any) {
    const message = "Internal Server Error";
    log.error(data);
    res.status(500).send({ message });
  }

  public static timeout(res: Response, data?: any) {
    const message = "Timeout";
    if (Buffer.isBuffer(data)) data = data.toString();
    res.status(504).json({ message, data });
  }
}

function handleDatabaseConstraintsError(err: any, res: Response) {
  return BaseController.conflict(res, err.errors[0].message);
}
function isDBConstraintError(err: any): boolean {
  return err.name === "SequelizeUniqueConstraintError";
}

export function handleServerError(err: any, res: Response) {
  if (err === ControllerErrors.NOT_FOUND) {
    return BaseController.notFound(res);
  }
  if (err === ControllerErrors.BAD_REQUEST) {
    return BaseController.badRequest(res);
  }
  if (isDBConstraintError(err)) {
    return handleDatabaseConstraintsError(err, res);
  }
  return BaseController.serverError(res, err);
}
