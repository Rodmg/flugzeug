import { ModelController } from "@/libraries/ModelController";
import { Profile } from "@/models/Profile";
import { filterOwner, appendUser } from "@/policies/General";
import { validateBody } from "@/libraries/Validator";
import { ProfileSchema } from "@/validators/Profile";
import {
  Auth,
  Controller,
  Get,
  Middlewares,
  Put,
} from "@/libraries/routes/decorators";

@Controller("profile", Profile)
export class ProfileController extends ModelController<Profile> {
  @Get("/")
  @Auth()
  @Middlewares([filterOwner()])
  getProfiles = (req, res) => this.handleFindAll(req, res);

  @Get("/:id")
  @Auth()
  @Middlewares([filterOwner()])
  getProfile = (req, res) => this.handleFindOne(req, res);

  @Put("/:id")
  @Auth()
  @Middlewares([validateBody(ProfileSchema), filterOwner(), appendUser()])
  putProfile = (req, res) => this.handleUpdate(req, res);
}

const controller = new ProfileController();
export default controller;
