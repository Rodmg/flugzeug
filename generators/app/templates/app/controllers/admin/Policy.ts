import { Controller } from "flugzeug";
import { ModelAdminController } from "@/libraries/ModelAdminController";
import { Policy } from "@/models/Policy";

@Controller("policy", Policy)
export class PolicyAdminController extends ModelAdminController<Policy> {}

const controller = new PolicyAdminController();
export default controller;
