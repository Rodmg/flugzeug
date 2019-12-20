import { Controller } from "./../../libraries/Controller";
import { Profile } from "./../../models/Profile";
import { Router } from "express";
import {
  validateJWT,
  filterOwner,
  appendUser,
  stripNestedObjects,
} from "./../../policies/General";

export class ProfileController extends Controller {
  constructor() {
    super();
    this.name = "profile";
    this.model = Profile;
  }

  routes(): Router {
    this.router.get("/", validateJWT("access"), filterOwner(), (req, res) =>
      this.find(req, res),
    );
    this.router.get("/:id", validateJWT("access"), filterOwner(), (req, res) =>
      this.findOne(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      (req, res) => this.update(req, res),
    );

    return this.router;
  }
}

const controller = new ProfileController();
export default controller;
