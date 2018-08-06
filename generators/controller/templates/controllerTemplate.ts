
import { Controller } from "./../../libraries/Controller";
import { <%- modelName %> } from "./../../models/<%- modelName %>";
import { Request, Response, Router } from "express";
import { validateJWT, filterOwner, appendUser, stripNestedObjects, filterRoles } from "./../../policies/General";

export class <%- controllerName %>Controller extends Controller {

  constructor() {
    super();
    this.name = "<%- pathName %>";
    this.model = <%- modelName %>;
  }

  routes(): Router {

    this.router.get("/", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.find(req, res));
    this.router.get("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.findOne(req, res));
    this.router.post("/", <% if (needsAuth) { %>validateJWT("access"), <% } %>stripNestedObjects(), <% if (belongsToUser) { %>filterOwner(), appendUser(), <% } %>(req, res) => this.create(req, res));
    this.router.put("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %>stripNestedObjects(), <% if (belongsToUser) { %>filterOwner(), appendUser(), <% } %>(req, res) => this.update(req, res));
    this.router.delete("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.destroy(req, res));

    return this.router;
  }

}

const <%- pathName %> = new <%- controllerName %>Controller();
export default <%- pathName %>;