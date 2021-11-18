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
  Authentication,
  Middlewares,
  Authorization
} from "@/libraries/routes/decorators";
import {
  ApiDocs,
  ApiDocsRouteSummary,
  ApiDocsAddSearchParameters
} from "@/libraries/documentation/decorators";

@Controller("<%- pathName %>", <%- modelName %>)
@ApiDocs()
<% if (needsAuth) { %>
@Authentication()
@Authorization()
<% } %>
export class <%- controllerName %>Controller extends ModelController<<%- modelName %>> {
  @ApiDocsRouteSummary("Get a list of <%- modelName %>s")
  @ApiDocsAddSearchParameters()
  @Get("/")
  <% if (needsAuth && belongsToUser) {%> @Middlewares([ filterOwner() ])<% } %>
  get<%- modelName %>s=(req, res) => this.handleFindAll(req, res);
  
  @ApiDocsRouteSummary("Get a <%- modelName %> by Id")
  @Get("/:id")
  <% if (needsAuth && belongsToUser) {%> @Middlewares([ filterOwner() ])<% } %>
  get<%- modelName %>=(req, res) => this.handleFindOne(req, res);

  @ApiDocsRouteSummary("Adds a new <%- modelName %>")
  @Post("/")
  @Middlewares([stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>])
  post<%- modelName %>=(req, res) => this.handleCreate(req, res);

  @ApiDocsRouteSummary("Upload <%- modelName %> by Id")
  @Put("/:id")
  @Middlewares([stripNestedObjects(), <% if (needsAuth && belongsToUser) { %>filterOwner(), appendUser(), <% } %>])
  put<%- modelName %>=(req, res) => this.handleUpdate(req, res);

  @ApiDocsRouteSummary("Delete <%- modelName %> by Id")
  @Delete("/:id")
  <% if (needsAuth && belongsToUser) {%> @Middlewares([ filterOwner() ])<% } %>
  delete<%- modelName %>=(req, res) => this.handleDelete(req, res);

}

const <%- pathName %> = new <%- controllerName %>Controller();
export default <%- pathName %>;