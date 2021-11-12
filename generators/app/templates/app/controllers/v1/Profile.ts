import { ModelController } from "@/libraries/ModelController";
import { Profile } from "@/models/Profile";
import { filterOwner, appendUser } from "@/policies/General";
import { validateBody } from "@/libraries/Validator";
import { ProfileSchema } from "@/validators/Profile";
import {
  Auth,
  Authorization,
  Controller,
  Get,
  Middlewares,
  Put,
} from "@/libraries/routes/decorators";

@Auth()
@Authorization()
@Middlewares([filterOwner()])
@Controller("profile", Profile)
export class ProfileController extends ModelController<Profile> {
  @Get("/")
  getProfiles = (req, res) => this.handleFindAll(req, res);

  @Get("/:id")
  getProfile = (req, res) => this.handleFindOne(req, res);

  @Put("/:id")
  @Middlewares([validateBody(ProfileSchema), filterOwner(), appendUser()])
  putProfile = (req, res) => this.handleUpdate(req, res);
}

const controller = new ProfileController();
export default controller;
