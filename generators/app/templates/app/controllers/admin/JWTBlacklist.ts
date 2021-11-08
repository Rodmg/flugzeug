import { Controller } from "@/libraries/routes/decorators";
import { ModelAdminController } from "@/libraries/ModelAdminController";
import { JWTBlacklist } from "@/models/JWTBlacklist";

@Controller("jwtlacklist", JWTBlacklist)
export class JWTBlacklistAdminController extends ModelAdminController<
  JWTBlacklist
> {}

const controller = new JWTBlacklistAdminController();
export default controller;
