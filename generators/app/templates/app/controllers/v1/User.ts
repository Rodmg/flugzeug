import { ModelController } from "@/libraries/ModelController";
import { User } from "@/models/User";
import { isSelfUser } from "@/policies/General";
import { validateBody } from "@/libraries/Validator";
import { UserSchema } from "@/validators/User";
import { query, Request, Response } from "express";
import {
  Controller,
  Get,
  Put,
  Delete,
  Authentication,
  Middlewares,
  Authorization,
} from "@/libraries/routes/decorators";
import {
  ApiDocs,
  ApiDocsRouteSummary,
  ApiDocsAddSearchParameters,
} from "@/libraries/documentation/decorators";

@ApiDocs(true)
@Authentication()
@Authorization()
@Controller("user", User)
export class UserController extends ModelController<User> {
  @ApiDocsRouteSummary("Get a List of Users")
  @ApiDocsAddSearchParameters()
  @Get("/")
  getUsers = (req: Request, res: Response) => {
    this.handleFindAll(req, res);
  };

  @ApiDocsRouteSummary("Get a User by Id")
  @Get("/:id", {
    authentication: true,
    authorization: true,
    middlewares: [isSelfUser()],
    schemaParams: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: {
          type: "string",
        },
        description: "The Resource identifier",
      },
    ],
  })
  getUser = (req: Request, res: Response) => {
    this.handleFindOne(req, res);
  };

  @ApiDocsRouteSummary("Upload a User by Id")
  @Put("/:id")
  @Middlewares([validateBody(UserSchema)])
  updateUser = (req: Request, res: Response) => {
    this.handleUpdate(req, res);
  };

  @ApiDocsRouteSummary("Delete User by Id")
  @Delete("/:id")
  deleteUser = (req: Request, res: Response) => {
    this.handleDelete(req, res);
  };
}

const controller = new UserController();
export default controller;
