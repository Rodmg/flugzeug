import { Controller } from "@/libraries/routes/decorators";
import { ModelAdminController } from "@/libraries/ModelAdminController";
import { UserRole } from "@/models/UserRole";

@Controller("userRole", UserRole)
export class UserRoleAdminController extends ModelAdminController<UserRole> {}

const controller = new UserRoleAdminController();
export default controller;
