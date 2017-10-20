import { Request } from 'express';
import * as core from 'express-serve-static-core';
import { Model, Hooks, Associations} from 'sequelize';
import * as Bluebird from 'bluebird';

declare module 'express' {
  export interface Request extends core.Request {
    session?: any;
  }
}

declare module 'sequelize' {
  export interface Model<TInstance, TAttributes> extends Hooks<TInstance>, Associations {
    getAssociations(): any;
  }
}

declare module 'nodemailer' {
  export interface SendMailOptions {
    template? : string;
    context?: any;
  }
}

declare module 'i18n' {
  export function init(request: any, response?: any, next?: Function): void;
}