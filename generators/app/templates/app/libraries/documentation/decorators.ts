import "reflect-metadata";
enum SchemaRequired {
  requestRequired = "requestRequired",
  responseRequired = "responseRequired",
  updateRequired = "updateRequired",
}
//classDecorator
//active Swager documentation for a Model
export function ApiDocs(active: boolean = true) {
  return (target) => {
    Reflect.defineMetadata("apiDocs", active, target.prototype);
    return target;
  };
}

// property decorator
export function RequestRequired(active: boolean = true) {
  return new ModelPropertyDecorator(SchemaRequired.requestRequired, active)
    .decorateProperty;
}
export function ResponseRequired(active: boolean = true) {
  return new ModelPropertyDecorator(SchemaRequired.responseRequired, active)
    .decorateProperty;
}

export function UpdateRequired(active: boolean = true) {
  return new ModelPropertyDecorator(SchemaRequired.updateRequired, active)
    .decorateProperty;
}

//Controller
export function ApiDocsSchemaResponse(
  schemaName: string,
  customSchema?: object,
  httpCode?: number,
) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("schemaResponse", schemaName, target, propertyKey);

    if (customSchema) {
      Reflect.defineMetadata(
        "customSchemaResponse",
        customSchema,
        target,
        propertyKey,
      );
    }
    if (httpCode) {
      Reflect.defineMetadata(
        "schemaResponseHttpCode",
        httpCode,
        target,
        propertyKey,
      );
    }
  };
}
export function ApiDocsSchemaRequest(
  schemaName: string,
  customSchema?: object,
) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("schemaRequest", schemaName, target, propertyKey);
    if (customSchema) {
      Reflect.defineMetadata(
        "customSchemaRequest",
        customSchema,
        target,
        propertyKey,
      );
    }
  };
}
export function ApiDocsRouteSummary(description: string) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("routeSummary", description, target, propertyKey);
  };
}
export function ApiDocsAddSearchParameters(active: boolean = true) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata("searchParameters", active, target, propertyKey);
  };
}

//Model Properties Decorator
class ModelPropertyDecorator {
  private metadataKey: string;
  private metadataValue: boolean;
  constructor(metadataKey: SchemaRequired, metadataValue: boolean) {
    this.metadataKey = metadataKey;
    this.metadataValue = metadataValue;
  }
  public decorateProperty = (target: any, propertyKey: string) => {
    Reflect.defineMetadata(
      this.metadataKey,
      this.metadataValue,
      target,
      propertyKey,
    );
  };
}

export function getApiDocs(target) {
  if (!target) {
    return false;
  }
  return Reflect.getMetadata("apiDocs", target.prototype) ?? false;
}

export function getRequestRequired(target, propertyKey) {
  return (
    Reflect.getMetadata(SchemaRequired.requestRequired, target, propertyKey) ??
    true
  );
}
export function getResponseRequired(target, propertyKey) {
  return (
    Reflect.getMetadata(SchemaRequired.responseRequired, target, propertyKey) ??
    true
  );
}

export function getUpdateRequired(target, propertyKey) {
  return (
    Reflect.getMetadata(SchemaRequired.updateRequired, target, propertyKey) ??
    true
  );
}

//RESPONSE SCHEMAS
export function getSchemaResponseName(target: any, propertyKey: string) {
  return Reflect.getMetadata("schemaResponse", target, propertyKey) ?? null;
}
export function isCustomSchemaResponse(
  target: any,
  propertyKey: string,
): boolean {
  return Reflect.hasMetadata("customSchemaResponse", target, propertyKey);
}
export function getHttpCode(target: any, propertyKey: string) {
  return Reflect.getMetadata("schemaResponseHttpCode", target, propertyKey);
}

export function getCustomSchemaResponse(target: any, propertyKey: string) {
  return (
    Reflect.getMetadata("customSchemaResponse", target, propertyKey) ?? null
  );
}
//REQUEST SCHEMAS
export function getSchemaRequestName(target: any, propertyKey: string) {
  return Reflect.getMetadata("schemaRequest", target, propertyKey) ?? null;
}
export function isCustomSchemaRequest(
  target: any,
  propertyKey: string,
): boolean {
  return Reflect.hasMetadata("customSchemaRequest", target, propertyKey);
}
export function getCustomSchemaRequest(target: any, propertyKey: string) {
  return (
    Reflect.getMetadata("customSchemaRequest", target, propertyKey) ?? null
  );
}
//Summary
export function getRouteSummary(target: any, propertyKey: string) {
  return Reflect.getMetadata("routeSummary", target, propertyKey) ?? "";
}
//searchParameters
export function addSearchParameters(target: any, propertyKey: string) {
  return Reflect.getMetadata("searchParameters", target, propertyKey) ?? false;
}
