import { Request } from 'express';
import * as core from 'express-serve-static-core';

declare module 'express' {
  export interface Request extends core.Request {
    session?: any;
  }
}

declare module 'i18n' {
  export function init(request: any, response?: any, next?: Function): void;
}