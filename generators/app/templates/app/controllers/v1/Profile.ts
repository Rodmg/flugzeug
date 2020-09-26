import { ModelController } from "@/libraries/ModelController";
import { Profile } from "@/models/Profile";
import { Router } from "express";
import {
  validateJWT,
  filterOwner,
  appendUser,
  stripNestedObjects,
} from "@/policies/General";

export class ProfileController extends ModelController<Profile> {
  constructor() {
    super();
    this.name = "profile";
    this.model = Profile;
  }

  routes(): Router {
    this.router.get("/", validateJWT("access"), filterOwner(), (req, res) =>
      this.handleFindAll(req, res),
    );
    this.router.get("/:id", validateJWT("access"), filterOwner(), (req, res) =>
      this.handleFindOne(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      (req, res) => this.handleUpdate(req, res),
    );

    return this.router;
  }
}

const controller = new ProfileController();
export default controller;
