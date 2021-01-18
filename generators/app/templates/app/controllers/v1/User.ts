import { ModelController } from "@/libraries/ModelController";
import { User } from "@/models/User";
import { Router } from "express";
import { validateJWT, isSelfUser, filterRoles } from "@/policies/General";
import { validateBody } from "@/libraries/Validator";
import { UserSchema } from "@/validators/User";

export class UserController extends ModelController<User> {
  constructor() {
    super();
    this.name = "user";
    this.model = User;
  }

  routes(): Router {
    this.router.get("/:id", validateJWT("access"), isSelfUser(), (req, res) =>
      this.handleFindOne(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      filterRoles(["admin"]),
      validateBody(UserSchema),
      (req, res) => this.handleUpdate(req, res),
    ); // only admin can edit user
    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterRoles(["admin"]),
      (req, res) => this.handleDelete(req, res),
    ); // only admin can delete user

    return this.router;
  }
}

const controller = new UserController();
export default controller;
