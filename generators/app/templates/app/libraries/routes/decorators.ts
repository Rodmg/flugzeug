import { ModelCtor } from "sequelize";
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

//Method Decorators
export function Get(path: string = "/") {
  return new ControllerMethodDecorator(HttpMethod.GET, path).decorateMethod;
}
export function Post(path: string = "/") {
  return new ControllerMethodDecorator(HttpMethod.POST, path).decorateMethod;
}
export function Put(path: string = "/") {
  return new ControllerMethodDecorator(HttpMethod.PUT, path).decorateMethod;
}
export function Delete(path: string = "/") {
  return new ControllerMethodDecorator(HttpMethod.DELETE, path).decorateMethod;
}
export function Auth(middlewares?: Array<Function>) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("auth", true, target, propertyKey);
    if (middlewares)
      Reflect.defineMetadata(
        "authMiddlewares",
        middlewares,
        target,
        propertyKey,
      );
  };
}
export function Middlewares(middlewares: Array<Function>) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("middlewares", middlewares, target, propertyKey);
  };
}

class ControllerMethodDecorator {
  private httpMethod: HttpMethod;
  private path: string;
  constructor(httpMethod: HttpMethod, path: string) {
    this.httpMethod = httpMethod;
    this.path = path;
  }

  public decorateMethod = (
    target: any,
    propertyKey: string,
    descriptor?: any,
  ) => {
    // Metdata
    Reflect.defineMetadata("httpMethod", this.httpMethod, target, propertyKey);
    Reflect.defineMetadata("path", this.path, target, propertyKey);

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
  return Reflect.getMetadata("auth", target, propertyKey) ?? false;
}
export function getAuthMiddlewares(target, propertyKey) {
  return Reflect.getMetadata("authMiddlewares", target, propertyKey) ?? [];
}

export function getMiddlewares(target, propertyKey) {
  return Reflect.getMetadata("middlewares", target, propertyKey) ?? [];
}
