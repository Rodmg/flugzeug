import { Controller } from "@/libraries/routes/decorators";
import { ModelAdminController } from "@/libraries/ModelAdminController";
import { Role } from "@/models/Role";

@Controller("role", Role)
export class RoleAdminController extends ModelAdminController<Role> {}

const controller = new RoleAdminController();
export default controller;
