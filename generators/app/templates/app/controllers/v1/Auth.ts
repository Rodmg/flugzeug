import { Controller, parseBody } from "@/libraries/Controller";
import { User } from "@/models/User";
import { Profile } from "@/models/Profile";
import { JWTBlacklist } from "@/models/JWTBlacklist";
import { Request, Response, Router } from "express";
import { log } from "@/libraries/Log";
import { config } from "@/config";
import { validateJWT, validateJWTOnQueryString } from "@/policies/General";
import mailer from "@/services/EmailService";
import _ from "lodash";
import moment from "moment";
import jwt from "jsonwebtoken";
import authService, {
  AuthCredentials,
  JWTPayload,
  Token,
} from "@/services/AuthService";
import uuid from "uuid";
import { validateBody } from "@/libraries/Validator";
import {
  AuthChangeSchema,
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthResendConfirmSchema,
  AuthResetPostSchema,
} from "@/validators/Auth";
import { Role } from "@/models/Role";
import onboardingService from "@/services/OnboardingService";

export class AuthController extends Controller {
  constructor() {
    super();
    this.name = "auth";
  }

  routes(): Router {
    this.router.post("/login", validateBody(AuthLoginSchema), (req, res) =>
      this.login(req, res),
    );
    this.router.post("/logout", validateJWT("access"), (req, res) =>
      this.logout(req, res),
    );
    this.router.post(
      "/register",
      validateBody(AuthRegisterSchema),
      (req, res) => this.register(req, res),
    );
    this.router.get("/reset", (req, res) => this.resetGet(req, res));
    this.router.post("/reset", validateBody(AuthResetPostSchema), (req, res) =>
      this.resetPost(req, res),
    );
    this.router.post(
      "/change",
      validateJWT("access"),
      validateBody(AuthChangeSchema),
      (req, res) => this.changePassword(req, res),
    );
    this.router.post("/refresh", validateJWT("refresh"), (req, res) =>
      this.refreshToken(req, res),
    );

    this.router.get(
      "/confirm",
      validateJWTOnQueryString("confirmEmail"),
      (req, res) => this.confirmEmail(req, res),
    );

    this.router.post(
      "/resendconfirm",
      validateBody(AuthResendConfirmSchema),
      (req, res) => this.resendConfirmEmail(req, res),
    );

    return this.router;
  }

  public createToken(user: User, type: string): Token {
    const expiryUnit: moment.unitOfTime.DurationConstructor =
      config.jwt[type].expiry.unit;
    const expiryLength: number = config.jwt[type].expiry.length;
    const rolesIds = user.roles.map(role => role.id);
    const expires =
      moment()
        .add(expiryLength, expiryUnit)
        .valueOf() / 1000;
    const issued = Date.now() / 1000;
    const expires_in = expires - issued; // seconds

    const token = jwt.sign(
      {
        id: user.id,
        sub: config.jwt[type].subject,
        aud: config.jwt[type].audience,
        exp: expires,
        iat: issued,
        jti: uuid.v4(),
        email: user.email,
        roles: rolesIds,
      },
      config.jwt.secret,
    );

    return {
      token: token,
      expires: expires,
      expires_in: expires_in,
    };
  }

  private sendEmailNewPassword(
    user: User,
    token: string,
    name?: string,
  ): Promise<any> {
    const subject = "Instructions for restoring your password";

    return mailer
      .sendEmail(
        user.email,
        subject,
        "password_recovery",
        user.profile.locale,
        {
          url: `${config.urls.baseApi}/auth/reset?token=${token}`,
          name: name || user.email,
        },
      )
      .then(info => {
        log.debug("Sending password recovery email to:", user.email, info);
        return info;
      });
  }

  private sendEmailPasswordChanged(user: User, name?: string): Promise<any> {
    const subject = "Password restored";

    return mailer
      .sendEmail(user.email, subject, "password_changed", user.profile.locale, {
        name: name || user.email,
      })
      .then(info => {
        log.debug("Sending password changed email to:", user.email, info);
        return info;
      });
  }

  private handleResetEmail(email: string): Promise<any> {
    return User.findOne({
      where: { email: email },
      include: [{ model: Profile, as: "profile" }],
    })
      .then(user => {
        if (!user) {
          throw { error: "notFound", msg: "Email not found" };
        }
        // Create reset token
        const token = this.createToken(user, "reset");
        return {
          token: token.token,
          email: email,
          name: user.name,
          user: user,
        };
      })
      .then(emailInfo => {
        return this.sendEmailNewPassword(
          emailInfo.user,
          emailInfo.token,
          emailInfo.name,
        );
      });
  }

  private handleResetChPass(
    token: string,
    password: string,
  ): Promise<AuthCredentials> {
    return this.validateJWT(token, "reset")
      .then(decodedjwt => {
        if (!decodedjwt) {
          throw { error: "unauthorized", msg: "Invalid Token" };
        }
        // Save new password
        const results = {
          user: null,
        };
        return User.findOne({
          where: { id: decodedjwt.id },
          include: [{ model: Profile, as: "profile" }],
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
              expires: new Date(decodedjwt.exp * 1000),
            }).catch(err => {
              log.error(err);
            });

            this.sendEmailPasswordChanged(results.user); // We send it asynchronously, we don't care if there is a mistake

            const credentials = authService.getCredentials(results.user);
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

  public validateJWT(token: string, type: string): Promise<JWTPayload> {
    // Decode token
    let decodedjwt: JWTPayload;
    try {
      decodedjwt = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (err) {
      return Promise.reject(err);
    }
    const reqTime = Date.now() / 1000;
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
    return JWTBlacklist.findOne({ where: { token: token } })
      .then(result => {
        // if exists in blacklist, reject
        if (result != null) return Promise.reject("This Token is blacklisted.");
        return decodedjwt;
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }

  login(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    // Validate
    if (email == null || password == null) return Controller.badRequest(res);

    const results = {
      user: null,
    };

    User.findOne({
      where: { email: email },
      include: [
        { model: Profile, as: "profile" },
        { model: Role, as: "roles" },
      ],
    })
      .then(user => {
        if (!user) {
          return false;
        }
        results.user = user;
        return user.authenticate(password);
      })
      .then(authenticated => {
        if (authenticated === true) {
          const credentials = authService.getCredentials(results.user);
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
    const token: string = req.session.jwtstring;
    const decodedjwt: JWTPayload = req.session.jwt;
    if (_.isUndefined(token)) return Controller.unauthorized(res);
    if (_.isUndefined(decodedjwt)) return Controller.unauthorized(res);
    // Put token in blacklist
    JWTBlacklist.create({
      token: token,
      expires: new Date(decodedjwt.exp * 1000),
    })
      .then(() => {
        Controller.ok(res);
        return null;
      })
      .catch(err => {
        return Controller.serverError(res, err);
      });
  }

  refreshToken(req: Request, res: Response) {
    // Refresh token has been previously authenticated in validateJwt as refresh token
    const refreshToken: string = req.session.jwtstring;
    const decodedjwt: JWTPayload = req.session.jwt;
    const reqUser: Pick<User, "id" | "email"> = req.session.user;
    // Put refresh token in blacklist
    JWTBlacklist.create({
      token: refreshToken,
      expires: new Date(decodedjwt.exp * 1000),
    })
      .then(() => {
        return User.findOne({ where: { id: reqUser.id } });
      })
      .then(user => {
        if (!user) {
          return Controller.unauthorized(res);
        }
        // Create new token and refresh token and send
        const credentials = authService.getCredentials(user);
        return Controller.ok(res, credentials);
      })
      .catch(err => {
        return Controller.serverError(res, err);
      });
  }

  async register(req: Request, res: Response) {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    };

    // Optional extra params:
    const locale: Profile["locale"] | undefined = req.body.locale;
    const timezone: string | undefined = req.body.timezone;

    // Validate
    if (newUser.email == null || newUser.password == null) {
      return Controller.badRequest(res);
    }

    try {
      if (config.emailAuth.requireEmailConfirmation) {
        // Validate if user exists but hasn't been confirmed
        const user = await User.findOne({
          where: {
            email: newUser.email,
            isActive: false,
            isEmailConfirmed: false,
          },
        });

        if (user != null) {
          // User existis but email hasn't been confirmed
          return Controller.conflict(res, "email pending validation");
        }
      }

      let user: User = await onboardingService.createUser(
        newUser.name,
        newUser.email,
        newUser.password,
      );
      // We need to do another query because before the profile wasn't ready
      // We need to do another query because before the role wasn't ready
      user = await User.findOne({
        where: { id: user.id },
        include: [
          { model: Profile, as: "profile" },
          { model: Role, as: "roles" },
        ],
      });
      // Set extra params:
      if (locale != null) user.profile.locale = locale;
      if (timezone != null) user.profile.time_zone = timezone;
      await user.profile.save();

      if (config.emailAuth.requireEmailConfirmation) {
        // Send Email Confirmation email
        try {
          const info = await this.handleSendConfirmEmail(user.email);
          log.info(info);
        } catch (err) {
          log.error(err);
          if (err.error == "badRequest")
            return Controller.badRequest(res, err.msg);
          if (err.error == "notFound") return Controller.notFound(res, err.msg);
          if (err.error == "serverError")
            return Controller.serverError(res, err.msg);
          return Controller.serverError(res);
        }
        return Controller.ok(res, "Please check your email inbox.");
      }

      const credentials = authService.getCredentials(user);
      return Controller.ok(res, credentials);
    } catch (err) {
      if (
        err.errors != null &&
        err.errors.length &&
        err.errors[0].type === "unique violation" &&
        err.errors[0].path === "email"
      ) {
        return Controller.forbidden(res, "email in use");
      } else if (err) {
        return Controller.serverError(res, err);
      }
    }
  }

  /*
    This can serve two different use cases:
      1. Request sending of recovery token via email (body: { email: '...' })
      2. Set new password (body: { token: 'mytoken', password: 'newpassword' })
  */
  resetPost(req: Request, res: Response) {
    // Validate if case 2
    const token: string = req.body.token;
    const password: string = req.body.password;

    if (!_.isUndefined(token) && !_.isUndefined(password)) {
      return this.handleResetChPass(token, password)
        .then(credentials => Controller.ok(res, credentials))
        .catch(err => {
          log.error(err);
          if (err.error == "badRequest")
            return Controller.badRequest(res, err.msg);
          if (err.error == "notFound") return Controller.notFound(res, err.msg);
          if (err.error == "serverError")
            return Controller.serverError(res, err.msg);
          return Controller.serverError(res);
        });
    }

    // Validate case 1
    const email: string = req.body.email;
    if (!_.isUndefined(email)) {
      return this.handleResetEmail(email)
        .then(info => {
          log.info(info);
          Controller.ok(res);
        })
        .catch(err => {
          log.error(err);
          if (err.error == "badRequest")
            return Controller.badRequest(res, err.msg);
          if (err.error == "notFound") return Controller.notFound(res, err.msg);
          if (err.error == "serverError")
            return Controller.serverError(res, err.msg);
          return Controller.serverError(res);
        });
    }

    return Controller.badRequest(res);
  }

  resetGet(req: Request, res: Response) {
    const token: string = req.query.token as string;
    if (_.isUndefined(token)) return Controller.unauthorized(res);
    // Decode token
    this.validateJWT(token, "reset")
      .then(decodedjwt => {
        if (decodedjwt)
          res.redirect(`${config.urls.base}/recovery/#/reset?token=${token}`);
        else Controller.unauthorized(res);
        return null;
      })
      .catch(err => {
        return Controller.unauthorized(res, err);
      });
  }

  changePassword(req: Request, res: Response) {
    const email = req.body.email;
    const oldPass = req.body.oldPass;
    const newPass = req.body.newPass;
    // Validate
    if (email == null || oldPass == null || newPass == null)
      return Controller.badRequest(res);
    if (email.length === 0 || oldPass.length === 0 || newPass.length === 0)
      return Controller.badRequest(res);
    // IMPORTANT: Check if email is the same as the one in the token
    if (email != req.session.jwt.email) return Controller.unauthorized(res);

    const results = {
      user: null,
    };

    User.findOne<User>({
      where: { id: req.session.jwt.id },
      include: [
        { model: Profile, as: "profile" },
        { model: Role, as: "roles" },
      ],
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
        const credentials = authService.getCredentials(results.user);
        return Controller.ok(res, credentials);
      })
      .catch(err => {
        log.error(err);
        return Controller.badRequest(res);
      });
  }

  async confirmEmail(req: Request, res: Response) {
    const userId = req.session.jwt.id;
    const email = req.session.user.email;
    if (userId == null) {
      return res.redirect(
        `${config.emailAuth.emailConfirmUrl}?success=false&email=${email}`,
      );
    }

    const user = await User.findByPk(userId);
    if (user == null) {
      return res.redirect(
        `${config.emailAuth.emailConfirmUrl}?success=false&email=${email}`,
      );
    }
    user.isActive = true;
    user.isEmailConfirmed = true;
    await user.save();
    return res.redirect(
      `${config.emailAuth.emailConfirmUrl}?success=true&email=${email}`,
    );
  }

  async resendConfirmEmail(req: Request, res: Response) {
    const { email } = parseBody(req);

    if (email == null) {
      return Controller.badRequest(res);
    }

    if (!config.emailAuth.requireEmailConfirmation) {
      return Controller.notFound(res);
    }

    // Validate if user exists but hasn't been confirmed
    const user = await User.findOne({
      where: {
        email,
        isActive: false,
        isEmailConfirmed: false,
      },
    });

    if (!user) {
      return Controller.notFound(res);
    }

    try {
      const info = await this.handleSendConfirmEmail(user.email);
      log.info(info);
    } catch (err) {
      log.error(err);
      if (err.error == "badRequest") return Controller.badRequest(res, err.msg);
      if (err.error == "notFound") return Controller.notFound(res, err.msg);
      if (err.error == "serverError")
        return Controller.serverError(res, err.msg);
      return Controller.serverError(res);
    }
    return Controller.ok(res, "Please check your email inbox.");
  }

  async handleSendConfirmEmail(email: string): Promise<any> {
    const user = await User.findOne({
      where: { email: email },
      include: [
        { model: Profile, as: "profile" },
        { model: Role, as: "roles" },
      ],
    });
    if (!user) {
      throw { error: "notFound", msg: "Email not found" };
    }
    // Create reset token
    const token = authService.createToken(user, "confirmEmail");
    return this.sendEmailConfirm(user, token.token, user.name);
  }

  private async sendEmailConfirm(
    user: User,
    token: string,
    name?: string,
  ): Promise<any> {
    const subject = "Welcome!, please verify your email address.";

    const info = await mailer.sendEmail(
      user.email,
      subject,
      "email_confirm",
      user.profile.locale,
      {
        url: `${config.urls.baseApi}/emailauth/confirm?token=${token}`,
        name: name || user.email,
        email: user.email,
      },
    );
    log.debug("Sending email confirm email to:", user.email, info);
    return info;
  }
}

const controller = new AuthController();
export default controller;
