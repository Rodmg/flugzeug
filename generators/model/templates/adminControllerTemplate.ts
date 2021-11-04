import { <%- modelName %> } from "@/models/<%- modelName %>";
import { Controller } from "@/libraries/routes/decorators";

import { ModelAdminController } from "@/libraries/ModelAdminController";

@Controller("<%- tableName %>", <%- modelName %>)
export class <%- modelName %>AdminController extends ModelAdminController<<%- modelName %>> {}

const controller = new <%- modelName %>AdminController();
export default controller;
