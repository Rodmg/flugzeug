import { ModelController } from "@/libraries/ModelController";
import { <%- modelName %> } from "@/models/<%- modelName %>";
import {
  filterOwner,
  appendUser,
  stripNestedObjects,
} from "@/policies/General";
import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Auth,
  Middlewares,
} from "@/libraries/routes/decorators";
import {
  ApiDocs,
  ApiDocsRouteSummary,
  ApiDocsAddSearchParameters
} from "@/libraries/documentation/decorators";
import { authorize } from "@/policies/Authorization";

@Controller("<%- pathName %>", <%- modelName %>)
@ApiDocs()
export class <%- controllerName %>Controller extends ModelController<<%- modelName %>> {
  @ApiDocsRouteSummary("Get a list of <%- modelName %>s")
  @ApiDocsAddSearchParameters()
  @Get("/")
  <% if (needsAuth) { %>@Auth([authorize()]) <% } %>
  @Middlewares([<% if (needsAuth && belongsToUser) { %>filterOwner() <% } %>])
  get<%- modelName %>s=(req, res) => this.handleFindAll(req, res);
  
  @ApiDocsRouteSummary("Get a <%- modelName %> by Id")
  @Get("/:id")
  <% if (needsAuth) { %>@Auth([authorize()]) <% } %>
  @Middlewares([<% if (needsAuth && belongsToUser) { %>filterOwner() <% } %>])
  get<%- modelName %>=(req, res) => this.handleFindOne(req, res);

  @ApiDocsRouteSummary("Adds a new <%- modelName %>")
  @Post("/")
  <% if (needsAuth) { %>@Auth([authorize()]) <% } %>
  @Middlewares([stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>])
  post<%- modelName %>=(req, res) => this.handleCreate(req, res);

  @ApiDocsRouteSummary("Upload <%- modelName %> by Id")
  @Put("/:id")
  <% if (needsAuth) { %>@Auth([authorize()]) <% } %>
  @Middlewares([stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>])
  put<%- modelName %>=(req, res) => this.handleUpdate(req, res);

  @ApiDocsRouteSummary("Delete <%- modelName %> by Id")
  @Delete("/:id")
  <% if (needsAuth) { %>@Auth([authorize()]) <% } %>
  @Middlewares([<% if (needsAuth && belongsToUser) { %>filterOwner() <% } %>])
  delete<%- modelName %>=(req, res) => this.handleDelete(req, res);

}

const <%- pathName %> = new <%- controllerName %>Controller();
export default <%- pathName %>;