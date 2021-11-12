require("dotenv").config();
import {
  addSearchParameters,
  getApiDocs,
  getCustomSchemaRequest,
  getCustomSchemaResponse,
  getHttpCode,
  getRouteSummary,
  getSchemaParameters,
  getSchemaRequestName,
  getSchemaResponseName,
  isCustomSchemaRequest,
  isCustomSchemaResponse,
} from "./decorators";
import path from "path";
import fs from "fs";
import YAML from "yaml";
import { config } from "@/config";
import {
  getRouteMetaData,
  isRoute,
  getAuthMetaData,
  getControllerAuthMetaData,
  isRouteAuth,
} from "@/libraries/routes/decorators";

import {
  requetSchemaGenerator,
  responseSchemaGenerator,
  updateSchemaGenerator,
} from "./schemaGenerators";
import pathGenerator from "./pathsGenerator";
import _ from "lodash";

const DOCUMENTATION_DIR = path.join(__dirname, "../../../app/documentation");

const importedCtrls1 = require("require-dir-all")("../../controllers/v1");
const controllers = Object.keys(importedCtrls1).map((k) => {
  return importedCtrls1[k].default;
});

// base estructure for open api schema
let openApiSchema = {
  openapi: "3.0.0",
  info: { title: "Docs", version: "1.0.0" },
  host: config.urls.url + ":" + config.urls.port,
  basePath: config.urls.apiRoot,
  servers: [
    {
      url:
        config.urls.protocol +
        "://" +
        config.urls.url +
        ":" +
        config.urls.port +
        config.urls.apiRoot,
      description: "server description",
    },
  ],
  paths: {},
  components: {
    schemas: {
      NotFound: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Not Found",
          },
        },
      },
      Unauthorized: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Unauthorized",
          },
          data: {
            type: "string",
            example: "No Token Present",
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  // security by bearerAuth is active globlaly by default
  security: [{ bearerAuth: [] }],
  tags: [],
};
//iterate through all registered controllers in api docs
for (const controller of controllers) {
  const documetController: boolean = getApiDocs(controller.constructor);

  if (documetController) {
    const model = controller?.model;
    const modelName = model?.name ?? controller.name;

    console.log("genarating documentation for : " + modelName + ".....");
    const documetModel: boolean = getApiDocs(model);
    //generate Base schemas of model in controller
    if (documetModel) {
      //add model requestSchema
      openApiSchema.components.schemas[
        modelName + "Request"
      ] = requetSchemaGenerator(model);
      //add model responseSchema
      openApiSchema.components.schemas[
        modelName + "Response"
      ] = responseSchemaGenerator(model);
      //add model array response
      openApiSchema.components.schemas[modelName + "ResponseList"] = {
        type: "object",
        properties: {
          message: { type: "string", example: "ok" },
          count: { type: "integer", example: 3 },
          limit: { type: "integer", example: 99 },
          offset: { type: "integer", example: 0 },
          data: {
            type: "array",
            items: {
              $ref: `#/components/schemas/${modelName}Response`,
            },
          },
        },
      };
      //add model updateScehama
      openApiSchema.components.schemas[
        modelName + "Update"
      ] = updateSchemaGenerator(model);
    }

    //generate paths based on controllers methods
    for (const property in controller) {
      if (isRoute(controller, property)) {
        // route config
        const routeConfig = getRouteMetaData(controller, property);

        const isAuthRequired = (() => {
          //route auth config
          const isRouteAuthPresent = isRouteAuth(controller, property);
          if (isRouteAuthPresent) {
            return getAuthMetaData(controller, property);
          } else {
            //controller Auth config
            return getControllerAuthMetaData(controller.constructor);
          }
        })();
        const path: string =
          `${controller.name}` + formatPath(routeConfig.path);
        const parameters: Array<object> = _.unionWith(
          getSchemaParameters(controller, property),
          extractPathParameters(path),
          (item1, item2) => {
            return item1.name == item2.name && item1.in == item2.in;
          },
        );
        const requestSchemaName = getSchemaRequestName(controller, property);
        const responseSchemaName = getSchemaResponseName(controller, property);
        const routeSummary = getRouteSummary(controller, property);
        const searchParameters = addSearchParameters(controller, property);
        const responseHttpCode = getHttpCode(controller, property);

        //register custom schemas if is required
        if (isCustomSchemaRequest(controller, property)) {
          openApiSchema.components.schemas[
            requestSchemaName
          ] = getCustomSchemaRequest(controller, property);
        }
        if (isCustomSchemaResponse(controller, property)) {
          openApiSchema.components.schemas[
            responseSchemaName
          ] = getCustomSchemaResponse(controller, property);
        }

        //register path
        openApiSchema.paths[`/${path}`] = {
          ...openApiSchema.paths[`/${path}`],
          ...pathGenerator(
            modelName,
            routeConfig.httpMethod,
            isAuthRequired,
            responseSchemaName,
            requestSchemaName,
            parameters,
            routeSummary,
            searchParameters,
            responseHttpCode,
          ),
        };
      }
    }
  }
}

//save documentation files
const doc = new YAML.Document();
doc.contents = openApiSchema;
fs.writeFileSync(
  path.join(DOCUMENTATION_DIR, "openApiSchema.json"),
  JSON.stringify(openApiSchema, null, 2),
);
fs.writeFileSync(
  path.join(DOCUMENTATION_DIR, "openApiSchema.yml"),
  doc.toString(),
);

//helper functions
function formatPath(path: string) {
  let currentIndex: number = 0;
  while (currentIndex < path.length - 1) {
    //find index of "/:"
    let startIndex: number = path.indexOf("/:", currentIndex);
    if (startIndex == -1) {
      break;
    }
    startIndex = startIndex + 2;
    //find index of the first "/" after "/:"
    let endIndex: number = path.indexOf("/", startIndex);
    if (endIndex == -1) {
      endIndex = path.length;
    }

    //get String between "/:" and "/"
    let replace: string = path.slice(startIndex, endIndex);
    //replace ":string" for "{string}"
    path = path.replace(`/:${replace}`, `/{${replace}}`);

    //update index
    currentIndex = endIndex;
  }
  return path;
}

function extractPathParameters(path: string) {
  let parameters = [];
  let currentIndex = 0;
  while (currentIndex < path.length - 1) {
    //find index of "/{"
    let startIndex = path.indexOf("/{", currentIndex);
    if (startIndex == -1) {
      break;
    }
    startIndex = startIndex + 2;
    //find index of the first "}" after "/{"
    let endIndex = path.indexOf("}", startIndex);
    if (endIndex == -1) {
      endIndex = path.length;
    }

    //get String between "/{" and "}"
    let parameter = path.slice(startIndex, endIndex);
    parameters.push({
      in: "path",
      name: parameter,
      required: true,
      schema: {
        type: "string",
      },
    });
    //update index
    currentIndex = endIndex;
  }
  return parameters;
}
