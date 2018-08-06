import { Controller } from "./../../libraries/Controller";
import { User } from "./../../models/User";
import { Profile } from "./../../models/Profile";
import { JWTBlacklist } from "./../../models/JWTBlacklist";
import { Request, Response, Router } from "express";
import { log } from "./../../libraries/Log";
import { config } from "./../../config/config";
import { validateJWT } from "./../../policies/General";
import mailer from "./../../services/EmailService";
import i18n from "./../../libraries/i18n";
import * as _ from "lodash";
import * as moment from "moment";
import * as path from "path";
import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";

export class AuthController extends Controller {
  constructor() {
    super();
    this.name = "auth";
  }

  routes(): Router {
    this.router.post("/login", (req, res) => this.login(req, res));
    this.router.post("/logout", validateJWT("access"), (req, res) => this.logout(req, res));
    this.router.post("/register", (req, res) => this.register(req, res));
    this.router.get("/reset", (req, res) => this.resetGet(req, res));
    this.router.post("/reset", (req, res) => this.resetPost(req, res));
    this.router.post("/change", validateJWT("access"), (req, res) => this.changePassword(req, res));
    this.router.post("/refresh", validateJWT("refresh"), (req, res) => this.refreshToken(req, res));

    return this.router;
  }

  public createToken(user: any, type: string) {
    let expiryUnit: any = config.jwt[type].expiry.unit;
    let expiryLength = config.jwt[type].expiry.length;
    let expires = moment()
      .add(expiryLength, expiryUnit)
      .valueOf();
    let issued = Date.now();
    let expires_in = (expires - issued) / 1000; // seconds

    let token = jwt.sign(
      {
        id: user.id,
        sub: config.jwt[type].subject,
        aud: config.jwt[type].audience,
        exp: expires,
        iat: issued,
        jti: uuid.v4(),
        email: user.email,
        role: user.role
      },
      config.jwt.secret
    );

    return {
      token: token,
      expires: expires,
      expires_in: expires_in
    };
  }

  protected getCredentials(user: any): any {
    // Prepare response object
    let token = this.createToken(user, "access");
    let refreshToken = this.createToken(user, "refresh");
    let credentials = {
      token: token.token,
      expires: token.expires,
      refresh_token: refreshToken,
      user: _.pick(user, ["id", "name", "email", "role"]),
      profile: user.profile
    };
    return credentials;
  }

  private sendEmailNewPassword(user: any, token: string, name?: string): Promise<any> {
    let subject = "Instructions for restoring your password";

    return mailer
      .sendEmail(user.email, subject, "password_recovery", user.profile.locale, {
        url: `${config.urls.baseApi}/auth/reset?token=${token}`,
        name: name || user.email
      })
      .then(info => {
        log.debug("Sending password recovery email to:", user.email, info);
        return info;
      });
  }

  private sendEmailPasswordChanged(user: any, name?: string): Promise<any> {
    let subject = "Password restored";

    return mailer
      .sendEmail(user.email, subject, "password_changed", user.profile.locale, {
        name: name || user.email
      })
      .then(info => {
        log.debug("Sending password changed email to:", user.email, info);
        return info;
      });
  }

  private handleResetEmail(email: string): Promise<any> {
    return Promise.resolve(
      User.findOne({ where: { email: email }, include: [{ model: Profile, as: "profile" }] })
        .then(user => {
          if (!user) {
            throw { error: "notFound", msg: "Email not found" };
          }
          // Create reset token
          let token = this.createToken(user, "reset");
          return { token: token.token, email: email, name: user.name, user: user };
        })
        .then(emailInfo => {
          return this.sendEmailNewPassword(emailInfo.user, emailInfo.token, emailInfo.name);
        })
    );
  }

  private handleResetChPass(token: string, password: string): Promise<any> {
    return this.validateJWT(token, "reset")
      .then(decodedjwt => {
        if (!decodedjwt) {
          throw { error: "unauthorized", msg: "Invalid Token" };
        }
        // Save new password
        let results = {
          user: null
        };
        return User.findOne({
          where: { id: decodedjwt.id },
          include: [{ model: Profile, as: "profile" }]
        })
          .then(user => {
            if (!user) {
              throw { error: "unauthorized" };
            }
            results.user = user;
            user.password = password;
            return user.save();
          })
          .then(result => {
            if (!result) {
              throw { error: "serverError", msg: null };
            }

            // Blacklist JWT asynchronously
            JWTBlacklist.create({
              token: token,
              expires: decodedjwt.exp
            }).catch(err => {
              log.error(err);
            });

            this.sendEmailPasswordChanged(results.user); // We send it asynchronously, we don't care if there is a mistake

            let credentials: any = this.getCredentials(results.user);
            return credentials;
          })
          .catch(err => {
            log.error(err);
            throw { error: "badRequest", msg: err };
          });
      })
      .catch(err => {
        throw { error: "unauthorized", msg: err };
      });
  }

  public validateJWT(token: string, type: string): Promise<any> {
    // Decode token
    let decodedjwt: any;
    try {
      decodedjwt = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return Promise.reject(err);
    }
    let reqTime = Date.now();
    // Check if token expired
    if (decodedjwt.exp <= reqTime) {
      return Promise.reject("Token expired");
    }
    // Check if token is early
    if (!_.isUndefined(decodedjwt.nbf) && reqTime <= decodedjwt.nbf) {
      return Promise.reject("This token is early.");
    }

    // If audience doesn't match
    if (config.jwt[type].audience !== decodedjwt.aud) {
      return Promise.reject("This token cannot be accepted for this domain.");
    }

    // If the subject doesn't match
    if (config.jwt[type].subject !== decodedjwt.sub) {
      return Promise.reject("This token cannot be used for this request.");
    }

    // Check if blacklisted
    return Promise.resolve(
      JWTBlacklist.findOne({ where: { token: token } })
        .then(result => {
          // if exists in blacklist, reject
          if (result != null) return Promise.reject("This Token is blacklisted.");
          return Promise.resolve(decodedjwt);
        })
        .catch(err => {
          return Promise.reject(err);
        })
    );
  }

  login(req: Request, res: Response) {
    let email = req.body.email;
    let password = req.body.password;
    // Validate
    if (email == null || password == null) return Controller.badRequest(res);

    let results = {
      user: null
    };

    User.findOne({ where: { email: email }, include: [{ model: Profile, as: "profile" }] })
      .then(user => {
        if (!user) {
          return false;
        }
        results.user = user;
        return user.authenticate(password);
      })
      .then(authenticated => {
        if (authenticated === true) {
          let credentials: any = this.getCredentials(results.user);
          return Controller.ok(res, credentials);
        } else {
          return Controller.unauthorized(res);
        }
      })
      .catch(err => {
        log.error(err);
        return Controller.badRequest(res);
      });
  }

  logout(req: Request, res: Response) {
    let token: string = req.session.jwtstring;
    let decodedjwt: any = req.session.jwt;
    if (_.isUndefined(token)) return Controller.unauthorized(res);
    if (_.isUndefined(decodedjwt)) return Controller.unauthorized(res);
    // Put token in blacklist
    JWTBlacklist.create({
      token: token,
      expires: decodedjwt.exp
    })
      .then(result => {
        Controller.ok(res);
        return null;
      })
      .catch(err => {
        return Controller.serverError(res, err);
      });
  }

  refreshToken(req: Request, res: Response) {
    // Refresh token has been previously authenticated in validateJwt as refresh token
    let refreshToken: string = req.session.jwtstring;
    let decodedjwt: any = req.session.jwt;
    let reqUser: any = req.session.user;
    // Put refresh token in blacklist
    JWTBlacklist.create({
      token: refreshToken,
      expires: decodedjwt.exp
    })
      .then(result => {
        return User.findOne({ where: { id: reqUser.id } });
      })
      .then((user: any) => {
        if (!user) {
          return Controller.unauthorized(res);
        }
        // Create new token and refresh token and send
        let credentials: any = this.getCredentials(user);
        return Controller.ok(res, credentials);
      })
      .catch(err => {
        return Controller.serverError(res, err);
      });
  }

  register(req: Request, res: Response) {
    let newUser = {
      email: req.body.email,
      password: req.body.password
    };

    // Optional extra params:
    let locale: string | undefined = req.body.locale;
    let timezone: string | undefined = req.body.timezone;

    // Validate
    if (newUser.email == null || newUser.password == null) return Controller.badRequest(res);
    // Email and password length should be validated on user create TODO test

    let user: any;
    User.create(newUser)
      .then(result => {
        // We need to do another query because before the profile wasn't ready
        return User.findOne({
          where: { id: result.id },
          include: [{ model: Profile, as: "profile" }]
        })
          .then(result => {
            user = result;
            // Set extra params:
            if (locale != null) user.profile.locale = locale;
            if (timezone != null) user.profile.time_zone = timezone;
            return user.profile.save();
          })
          .then(result => {
            let credentials: any = this.getCredentials(user);
            return Controller.ok(res, credentials);
          });
      })
      .catch(err => {
        if (
          err.errors != null &&
          err.errors.length &&
          err.errors[0].type === "unique violation" &&
          err.errors[0].path === "email"
        ) {
          return Controller.forbidden(res, "email in use");
        } else if (err) return Controller.serverError(res, err);
      });
  }

  /*
    This can serve two different use cases:
      1. Request sending of recovery token via email (body: { email: '...' })
      2. Set new password (body: { token: 'mytoken', password: 'newpassword' })
  */
  resetPost(req: Request, res: Response) {
    // Validate if case 2
    let token: string = req.body.token;
    let password: string = req.body.password;

    if (!_.isUndefined(token) && !_.isUndefined(password)) {
      return this.handleResetChPass(token, password)
        .then(credentials => Controller.ok(res, credentials))
        .catch(err => {
          log.error(err);
          if (err.error == "badRequest") return Controller.badRequest(res, err.msg);
          if (err.error == "notFound") return Controller.notFound(res, err.msg);
          if (err.error == "serverError") return Controller.serverError(res, err.msg);
          return Controller.serverError(res);
        });
    }

    // Validate case 1
    let email: string = req.body.email;
    if (!_.isUndefined(email)) {
      return this.handleResetEmail(email)
        .then(info => {
          log.info(info);
          Controller.ok(res);
        })
        .catch(err => {
          log.error(err);
          if (err.error == "badRequest") return Controller.badRequest(res, err.msg);
          if (err.error == "notFound") return Controller.notFound(res, err.msg);
          if (err.error == "serverError") return Controller.serverError(res, err.msg);
          return Controller.serverError(res);
        });
    }

    return Controller.badRequest(res);
  }

  resetGet(req: Request, res: Response) {
    let token: any = req.query.token;
    if (_.isUndefined(token)) return Controller.unauthorized(res);
    // Decode token
    this.validateJWT(token, "reset")
      .then(decodedjwt => {
        if (decodedjwt) res.redirect(`${config.urls.base}/recovery/#/reset?token=${token}`);
        else Controller.unauthorized(res);
        return null;
      })
      .catch(err => {
        return Controller.unauthorized(res, err);
      });
  }

  changePassword(req: Request, res: Response) {
    let email = req.body.email;
    let oldPass = req.body.oldPass;
    let newPass = req.body.newPass;
    // Validate
    if (email == null || oldPass == null || newPass == null) return Controller.badRequest(res);
    if (email.length === 0 || oldPass.length === 0 || newPass.length === 0)
      return Controller.badRequest(res);
    // IMPORTANT: Check if email is the same as the one in the token
    if (email != req.session.jwt.email) return Controller.unauthorized(res);

    let results = {
      user: null
    };

    User.findOne<User>({
      where: { id: req.session.jwt.id },
      include: [{ model: Profile, as: "profile" }]
    })
      .then((user: User) => {
        if (!user) {
          return false;
        }
        results.user = user;
        return user.authenticate(oldPass);
      })
      .then(authenticated => {
        if (authenticated === true) {
          results.user.password = newPass;
          return results.user.save();
        } else {
          return Controller.unauthorized(res);
        }
      })
      .then(result => {
        if (!result) return Controller.serverError(res);
        let credentials: any = this.getCredentials(results.user);
        return Controller.ok(res, credentials);
      })
      .catch(err => {
        log.error(err);
        return Controller.badRequest(res);
      });
  }
}

const controller = new AuthController();
export default controller;
