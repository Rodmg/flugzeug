import { Application, static as Static } from "express";
import * as path from "path";
import { log } from "@/libraries/Log";

const importedCtrls1 = require("require-dir-all")("controllers/v1");
const controllers1 = Object.keys(importedCtrls1).map(
  k => importedCtrls1[k].default,
);

export function routes(app: Application) {
  for (const controller of controllers1) {
    if (controller.name == null || controller.name.length === 0) {
      log.error("Invalid controller name:", controller.name, controller);
      continue;
    }
    app.use(`/api/v1/${controller.name}`, controller.routes());
  }

  app.use(Static(path.join(__dirname, "../public")));

  // // All undefined asset or api routes should return a 404
  // app.route('/:url(api|auth|components|app|bower_components|assets)/*')
  //  .get(errors[404]);
}
