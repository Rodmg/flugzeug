import { Application, static as Static } from "express";
import path from "path";
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

  // Not Found Handler
  app.use((req, res) => {
    res.status(404);

    if (req.accepts("html")) {
      res.render("404");
      return;
    }

    if (req.accepts("json")) {
      res.send({ error: "Not Found" });
      return;
    }

    res.type("txt").send("Not Found");
  });
}
