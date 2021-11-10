import {
  getRequestRequired,
  getResponseRequired,
  getUpdateRequired,
} from "./decorators";

export function requetSchemaGenerator(model: any) {
  const attributes = model.rawAttributes;
  const modelInstance = new model();
  //base schema specification
  let schema = { type: "object", properties: {} };

  Object.keys(attributes).forEach(attribute => {
    //not part of schema
    if (
      attribute == "id" ||
      attribute == "createdAt" ||
      attribute == "updatedAt" ||
      !getRequestRequired(modelInstance, attribute)
    ) {
      return;
    }

    let type = attributes[attribute].type.constructor.name.toLowerCase();
    schema.properties[attribute] = formatAttribute(type, attribute, attributes);
  });

  return schema;
}

export function responseSchemaGenerator(model: any) {
  const attributes = model.rawAttributes;
  const modelInstance = new model();
  //base schema specification
  let schema = { type: "object", properties: {} };

  Object.keys(attributes).forEach(attribute => {
    //not part of schema
    if (!getResponseRequired(modelInstance, attribute)) {
      return;
    }

    let type = attributes[attribute].type.constructor.name.toLowerCase();
    schema.properties[attribute] = formatAttribute(type, attribute, attributes);
  });

  return schema;
}

export function updateSchemaGenerator(model: any) {
  const attributes = model.rawAttributes;
  const modelInstance = new model();
  //base schema specification
  let schema = { type: "object", properties: {} };

  Object.keys(attributes).forEach(attribute => {
    //not part of schema
    if (
      attribute == "id" ||
      attribute == "createdAt" ||
      attribute == "updatedAt" ||
      !getUpdateRequired(modelInstance, attribute)
    ) {
      return;
    }

    let type = attributes[attribute].type.constructor.name.toLowerCase();
    schema.properties[attribute] = formatAttribute(type, attribute, attributes);
  });

  return schema;
}

function formatAttribute(type, attribute, attributes) {
  switch (type) {
    case "enum":
      return {
        type: "string",
        enum: attributes[attribute].type.values,
      };
      break;
    case "date":
      return {
        type: "string",
      };
      break;
    default:
      return {
        type,
      };
      break;
  }
}
