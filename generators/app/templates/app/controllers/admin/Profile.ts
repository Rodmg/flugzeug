import { Controller } from "@/libraries/routes/decorators";
import { ModelAdminController } from "@/libraries/ModelAdminController";
import { Profile } from "@/models/Profile";

@Controller("profile", Profile)
export class ProfileAdminController extends ModelAdminController<Profile> {}

const controller = new ProfileAdminController();
export default controller;
