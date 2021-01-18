import { ModelController } from "@/libraries/ModelController";
import { <%- modelName %> } from "@/models/<%- modelName %>";
import { Router } from "express";
import {
  validateJWT,
  filterOwner,
  appendUser,
  stripNestedObjects,
} from "@/policies/General";

export class <%- controllerName %>Controller extends ModelController<<%- modelName %>> {

  constructor() {
    super();
    this.name = "<%- pathName %>";
    this.model = <%- modelName %>;
  }

  routes(): Router {

    this.router.get("/", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (needsAuth && belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.handleFindAll(req, res));
    this.router.get("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (needsAuth && belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.handleFindOne(req, res));
    this.router.post("/", <% if (needsAuth) { %>validateJWT("access"), <% } %>stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>(req, res) => this.handleCreate(req, res));
    this.router.put("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %>stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>(req, res) => this.handleUpdate(req, res));
    this.router.delete("/:id", <% if (needsAuth) { %>validateJWT("access"), <% } %><% if (needsAuth && belongsToUser) { %>filterOwner(), <% } %>(req, res) => this.handleDelete(req, res));

    return this.router;
  }

}

const <%- pathName %> = new <%- controllerName %>Controller();
export default <%- pathName %>;