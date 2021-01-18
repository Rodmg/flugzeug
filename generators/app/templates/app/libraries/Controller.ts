import { Request, Response, Router } from "express";
import { log } from "./Log";
import _ from "lodash";

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

export class Controller {
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
    // Setup your routes here
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
  return Controller.conflict(res, err.errors[0].message);
}
function isDBConstraintError(err: any): boolean {
  return err.name === "SequelizeUniqueConstraintError";
}

export function handleServerError(err: any, res: Response) {
  if (err === ControllerErrors.NOT_FOUND) {
    return Controller.notFound(res);
  }
  if (err === ControllerErrors.BAD_REQUEST) {
    return Controller.badRequest(res);
  }
  if (isDBConstraintError(err)) {
    return handleDatabaseConstraintsError(err, res);
  }
  return Controller.serverError(res, err);
}
