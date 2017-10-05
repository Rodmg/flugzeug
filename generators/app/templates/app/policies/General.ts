import { Request, Response } from 'express';
import { default as auth } from './../controllers/v1/Auth';
import * as _ from 'lodash';
import { Model } from 'sequelize';
import { Controller } from './../libraries/Controller';

/*
  Validates a JWT
  puts decoded jwt in req.session.jwt
  puts user object with id, email and role in req.session.user
*/
export function validateJWT(type: string) {
  return (req: Request, res: Response, next: Function) => {
    let token: string = null;
    let authorization: string = req.get('Authorization');
    if(authorization == null) {
      Controller.unauthorized(res, 'No Token Present');
      return null;
    }
    let parts: Array<string> = authorization.split(' ');
    if(parts.length === 2) {
      let scheme: string = parts[0];
      let credentials: string = parts[1];

      if (/^Bearer$/i.test(scheme)) {
         token = credentials;
      }
    }

    auth.validateJWT(token, type)
      .then((decoded) => {
        if(!decoded) {
          Controller.unauthorized(res, 'Invalid Token');
          return null;
        }
        if(req.session == null) req.session = {};
        req.session.jwt = decoded;
        req.session.jwtstring = token;
        req.session.user = _.pick(decoded, ['id', 'email', 'role']);
        next();
        return null;
      })
      .catch((err) => {
        Controller.unauthorized(res, err);
      })
  }

}

/*
  Enforces access only to owner
    key: key to compare user id
*/
export function filterOwner(key: string = 'userId') {
  return (req: Request, res: Response, next: Function) => {
    if(req.session == null) req.session = {};
    let id = req.session.jwt.id;
    if(id == null) return Controller.unauthorized(res);
    if(req.session.where == null) req.session.where = {};
    req.session.where[key] = id;
    next();
  }
}

export function isOwner(model: Model<any, any>, key: string = 'userId') {
  return (req: Request, res: Response, next: Function) => {
    let userId = req.session.jwt.id;
    if(userId == null) return Controller.unauthorized(res);
    let id: number = req.params.id;
    if(id == null) return Controller.badRequest(res, 'Bad Request: No id in request.');
    model.findById(id)
    .then((result: any) => {
      if(!result) return Controller.notFound(res);
      if(result[key] !== userId) return Controller.forbidden(res);
      req.session.instance = result;
      next();
    })
    .catch(err => {
      Controller.serverError(res);
    });
  }
}

/*
  Appends userId to body (useful for enforcing ownership when creating items)
    key: key to add/modify on body
*/
export function appendUser(key: string = 'userId') {
  return (req: Request, res: Response, next: Function) => {
    if(req.session == null) req.session = {};
    let id = req.session.jwt.id;
    if(id == null) return Controller.unauthorized(res);
    if(!req.body) req.body = {};
    req.body[key] = id;
    next();
  }
}

/*
  Strips nested objects, substituting with their id (if any)
*/
export function stripNestedObjects() {
  return (req: Request, res: Response, next: Function) => {
    if(!req.body) req.body = {};
    // Iterate through all keys in the body
    for (let key in req.body)
    {
      if (req.body.hasOwnProperty(key)) // Validate if not from prototype
      {
        if( Object.prototype.toString.call( req.body[key] ) === '[object Object]' )
        {
          // Append id and delete original
          if(req.body[key].id !== undefined) req.body[`${key}Id`] = req.body[key].id;
          delete req.body[key];
        }
      }
    }
    next();
  }
}

/*
  Only allows certain roles to pass
*/
export function filterRoles(roles: Array<string>) {
  return (req: Request, res: Response, next: Function) => {
    if(req.session == null) req.session = {};
    let role = req.session.jwt.role;
    if(role == null) return Controller.unauthorized(res);
    if(roles.indexOf(role) < 0) return Controller.unauthorized(res);
    next();
  }
}

/*
  Checks if the requested user is self
  ** Only applicable to UserController
*/
export function isSelfUser() {
  return (req: Request, res: Response, next: Function) => {
    if(req.session == null) req.session = {};
    let id = req.session.jwt.id;
    if(id == null) return Controller.unauthorized(res);
    if(parseInt(id) !== parseInt(req.params.id)) return Controller.unauthorized(res);
    next();
  }
}

