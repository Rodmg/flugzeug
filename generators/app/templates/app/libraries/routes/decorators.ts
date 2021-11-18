import _ from "lodash";
import { ModelCtor } from "sequelize";
import {
  ApiDocsSchemaParams,
  ApiDocsSchemaRequest,
  ApiDocsSchemaResponse,
} from "../documentation/decorators";
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
}

//class Decorators
export function Controller(name: string, model?: ModelCtor<any>) {
  return <T extends { new (...args: any[]): {} }>(target: T) => {
    Reflect.defineMetadata("controllerName", name, target.prototype);

    if (model) {
      return class extends target {
        public name: string = name;
        model: ModelCtor<any> = model;
      };
    }
    return class extends target {
      public name: string = name;
    };
  };
}

export type MethodDecoratorOptions = {
  authentication: boolean;
  authorization: boolean;
  middlewares?: Array<Function>;

  routeSummary?: string;
  schemaRequest?: {
    name: string;
    schema?: object;
  };
  schemaResponse?: {
    name: string;
    schema?: object;
    httpCode?: number;
  };
  schemaParams?: Array<object>;
};

//Method Decorators
export function Get(path: string = "/", options?: MethodDecoratorOptions) {
  return new ControllerMethodDecorator(HttpMethod.GET, path, options)
    .decorateMethod;
}
export function Post(path: string = "/", options?: MethodDecoratorOptions) {
  return new ControllerMethodDecorator(HttpMethod.POST, path, options)
    .decorateMethod;
}
export function Put(path: string = "/", options?: MethodDecoratorOptions) {
  return new ControllerMethodDecorator(HttpMethod.PUT, path, options)
    .decorateMethod;
}
export function Delete(path: string = "/", options?: MethodDecoratorOptions) {
  return new ControllerMethodDecorator(HttpMethod.DELETE, path, options)
    .decorateMethod;
}
//Class and Property decorators
export function Authentication(active: boolean = true) {
  return (target: any, propertyKey?: string) => {
    let authKey = "authentication";
    let targetKey = target;
    //is a class decorator
    if (!propertyKey) {
      authKey = "controllerAuth";
      targetKey = targetKey.prototype;
    }
    Reflect.defineMetadata(authKey, active, targetKey, propertyKey);
  };
}
export function Authorization(active: boolean = true) {
  return (target: any, propertyKey?: string) => {
    let authorizationKey = "authorization";
    let targetKey = target;
    //is a class decorator
    if (!propertyKey) {
      authorizationKey = "controllerAuthorization";
      targetKey = targetKey.prototype;
    }
    Reflect.defineMetadata(authorizationKey, active, target, propertyKey);
  };
}
export function Middlewares(middlewares: Array<Function>) {
  return (target: any, propertyKey?: string) => {
    let middlewaresKey = "middlewares";
    let targetKey = target;
    //is a class decorator
    if (!propertyKey) {
      middlewaresKey = "controllerMiddlewares";
      targetKey = targetKey.prototype;
    }
    Reflect.defineMetadata(middlewaresKey, middlewares, target, propertyKey);
  };
}

class ControllerMethodDecorator {
  private httpMethod: HttpMethod;
  private path: string;
  private options: MethodDecoratorOptions;
  constructor(
    httpMethod: HttpMethod,
    path: string,
    options?: MethodDecoratorOptions,
  ) {
    this.httpMethod = httpMethod;
    this.path = path;
    this.options = options;
  }

  public decorateMethod = (
    target: any,
    propertyKey: string,
    descriptor?: any,
  ) => {
    // Metdata
    Reflect.defineMetadata("httpMethod", this.httpMethod, target, propertyKey);
    Reflect.defineMetadata("path", this.path, target, propertyKey);
    //complete definition using Method decorator
    if (!_.isUndefined(this.options)) {
      //auth
      Reflect.defineMetadata(
        "authentication",
        this.options.authentication,
        target,
        propertyKey,
      );
      //authorization
      Authorization(this.options.authorization)(target, propertyKey);
      //Middlewares
      if (!_.isUndefined(this.options.middlewares))
        Middlewares(this.options.middlewares)(target, propertyKey);
      //Schema request
      if (!_.isUndefined(this.options.schemaRequest)) {
        const schemaRequest = this.options.schemaRequest;
        ApiDocsSchemaRequest(schemaRequest.name, schemaRequest.schema)(
          target,
          propertyKey,
        );
      }
      //Schema response
      if (!_.isUndefined(this.options.schemaResponse)) {
        const schemaResponse = this.options.schemaResponse;
        ApiDocsSchemaResponse(
          schemaResponse.name,
          schemaResponse.schema,
          schemaResponse.httpCode,
        )(target, propertyKey);
      }
      //Schema params
      if (!_.isUndefined(this.options.schemaParams)) {
        ApiDocsSchemaParams(this.options.schemaParams)(target, propertyKey);
      }
    }

    //if there is a descriptor for normal functions
    if (descriptor) {
      descriptor.enumerable = true;
      return descriptor;
    }

    //if there is not a descriptor for arrow functions
    if (!descriptor) {
      Reflect.defineProperty(target, propertyKey, {
        set: function (this: any, val) {
          // here we have reference to instance and can set property directly to it
          Reflect.defineProperty(this, propertyKey, {
            value: val,
            writable: true,
            enumerable: true,
          });
        },
      });
    }
  };
}

// Metadata getters

export function getControllerMetadata(target) {
  return Reflect.getMetadata("controllerName", target.prototype) ?? "";
}
export function getControllerAuthMetaData(target) {
  return Reflect.getMetadata("controllerAuth", target.prototype) ?? false;
}
export function getControllerAuthorizationMetaData(target) {
  return (
    Reflect.getMetadata("controllerAuthorization", target.prototype) ?? false
  );
}
export function getControllerMiddlewaresMetaData(target) {
  return Reflect.getMetadata("controllerMiddlewares", target.prototype) ?? [];
}
export function isRoute(target: any, propertyKey: string): boolean {
  return Reflect.hasMetadata("httpMethod", target, propertyKey);
}

export function getRouteMetaData(
  target: any,
  propertyKey: string,
): { path: string; httpMethod: string } {
  return {
    path: Reflect.getMetadata("path", target, propertyKey),
    httpMethod: Reflect.getMetadata("httpMethod", target, propertyKey),
  };
}

export function getAuthMetaData(target, propertyKey) {
  return Reflect.getMetadata("authentication", target, propertyKey) ?? false;
}
export function isRouteAuth(target: any, propertyKey: string): boolean {
  return Reflect.hasMetadata("authentication", target, propertyKey);
}

export function getAuthorizationMetaData(target, propertyKey) {
  return Reflect.getMetadata("authorization", target, propertyKey) ?? false;
}
export function isRouteAuthorization(
  target: any,
  propertyKey: string,
): boolean {
  return Reflect.hasMetadata("authorization", target, propertyKey);
}

export function getMiddlewares(target, propertyKey) {
  return Reflect.getMetadata("middlewares", target, propertyKey) ?? [];
}
export function isRouteMiddlewares(target: any, propertyKey: string): boolean {
  return Reflect.hasMetadata("middlewares", target, propertyKey);
}
