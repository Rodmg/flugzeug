import core from "express-serve-static-core";
import { JWTPayload } from "./controllers/v1/Auth";
import { User } from "./models/User";

declare module "express" {
  interface Request<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = core.Query
  > extends core.Request<P, ResBody, ReqBody, ReqQuery> {
    session?: {
      jwtstring?: string;
      jwt?: JWTPayload;
      user?: Pick<User, "id" | "email" | "role">;
      where?: any;
      include?: any;
      attributes?: any;
    } & { [key: string]: any };
  }
}

declare module "i18n" {
  export function init(request: any, response?: any, next?: Function): void;
}
