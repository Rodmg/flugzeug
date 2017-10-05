
import { Controller } from './../../libraries/Controller';
import { Profile } from './../../models/Profile';
import { Request, Response, Router } from 'express';
import { validateJWT, filterOwner, appendUser, stripNestedObjects, filterRoles } from './../../policies/General';
import { SocketRouter, SocketRequest, SocketResponse } from './../../libraries/SocketRest';


export class ProfileController extends Controller {

  constructor() {
    super();
    this.name = 'profile';
    this.model = Profile;
  }

  routes(): Router {

    this.router.get('/', validateJWT('access'), filterOwner(), (req, res) => this.find(req, res));
    this.router.get('/:id', validateJWT('access'), filterOwner(), (req, res) => this.findOne(req, res));
    this.router.put('/:id', validateJWT('access'), stripNestedObjects(), filterOwner(), appendUser(), (req, res) => this.update(req, res));

    return this.router;
  }

  socketRoutes(): SocketRouter {

    this.socketRouter.get('/', filterOwner(), (req, res) => this.find(req, res));
    this.socketRouter.get('/:id', filterOwner(), (req, res) => this.findOne(req, res));
    this.socketRouter.put('/:id', stripNestedObjects(), filterOwner(), appendUser(), (req, res) => this.update(req, res));

    return this.socketRouter;
  }

}

const controller = new ProfileController();
export default controller;