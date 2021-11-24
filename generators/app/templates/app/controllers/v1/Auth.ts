import { BaseController, parseBody } from "@/libraries/BaseController";
import { User } from "@/models/User";
import { Profile } from "@/models/Profile";
import { JWTBlacklist } from "@/models/JWTBlacklist";
import { Request, Response } from "express";
import { log } from "@/libraries/Log";
import { config } from "@/config";
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
import { validateJWTOnQueryString } from "@/policies/General";

import {
  AuthChangeSchema,
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthResendConfirmSchema,
} from "@/validators/Auth";
import {
  Controller,
  Get,
  Post,
  Authentication,
  Middlewares,
} from "flugzeug";
import {
  ApiDocs,
  ApiDocsRouteSummary,
  ApiDocsSchemaResponse,
  ApiDocsSchemaRequest,
} from "flugzeug";
import { Role } from "@/models/Role";

@Controller("auth")
export class AuthController extends BaseController {
  @ApiDocsRouteSummary("Log in with a email and password")
  @ApiDocsSchemaRequest("authLoginRequest", {
    type: "object",
    properties: {
      email: {
        type: "string",
        example: "example@email.com",
      },
      password: {
        type: "string",
        example: "Password123",
      },
    },
  })
  @ApiDocsSchemaResponse(
    "authLoginResponse",
    {
      type: "object",
      properties: {
        token: {
          type: "string",
          example:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MTYzODExMTA3MS40NDQsImlhdCI6MTYzNTUxOTA3MS40NDUsImp0aSI6Ijc0ZWFkZjc0LTk1ZWEtNDQ4YS1iZTA3LWZkYjc2Zjc4ZjRjNCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4ifQ._90EEQMvpAC6bgSr-DmPwwLJ9O3OTw5GqVwxwHLT82Q",
        },
        expires: {
          type: "number",
          example: 1638111071.444,
        },
        refresh_token: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3ViIjoicmVmcmVzaCIsImF1ZCI6InVzZXIiLCJleHAiOjE2NTEyNDM4NzEuNDQ4LCJpYXQiOjE2MzU1MTkwNzEuNDQ4LCJqdGkiOiI0NzU3ZDg2NS01YzYwLTQ1OGEtYjc2MC1jY2FkNTAzOTFlNDgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIn0.L93FVp9V5jPL2lq3hW7m3B9kKYC6I3KZys_YgO9QTM",
            },
            expires: {
              type: "number",
              example: 1651243871.448,
            },
            expires_in: {
              type: "number",
              example: 15724800,
            },
          },
        },
        user: {
          $ref: `#/components/schemas/UserResponse`,
        },
        profile: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            time_zone: {
              type: "string",
              example: "America/Mexico_City",
            },
            locale: {
              type: "string",
              example: "es",
            },
            userId: {
              type: "integer",
              example: 1,
            },
            createdAt: {
              type: "string",
              example: "2021-10-25T22:12:00.826Z",
            },
            updatedAt: {
              type: "string",
              example: "2021-10-25T22:12:00.826Z",
            },
          },
        },
      },
    },
    200,
  )
  @Post("/login")
  @Middlewares([validateBody(AuthLoginSchema)])
  login = (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    // Validate
    if (email == null || password == null)
      return BaseController.badRequest(res);

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
      .then((user) => {
        if (!user) {
          return false;
        }
        results.user = user;
        return user.authenticate(password);
      })
      .then((authenticated) => {
        if (authenticated === true) {
          const credentials = authService.getCredentials(results.user);
          return BaseController.ok(res, credentials);
        } else {
          return BaseController.unauthorized(res);
        }
      })
      .catch((err) => {
        log.error(err);
        return BaseController.badRequest(res);
      });
  };

  @Post("/logout")
  @Authentication()
  logout = (req: Request, res: Response) => {
    const token: string = req.session.jwtstring;
    const decodedjwt: JWTPayload = req.session.jwt;
    if (_.isUndefined(token)) return BaseController.unauthorized(res);
    if (_.isUndefined(decodedjwt)) return BaseController.unauthorized(res);
    // Put token in blacklist
    JWTBlacklist.create({
      token: token,
      expires: new Date(decodedjwt.exp * 1000),
    })
      .then(() => {
        BaseController.ok(res);
        return null;
      })
      .catch((err) => {
        return BaseController.serverError(res, err);
      });
  };

  @Post("/register")
  @Middlewares([validateBody(AuthRegisterSchema)])
  register = async (req: Request, res: Response) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
    };

    // Optional extra params:
    const locale: Profile["locale"] | undefined = req.body.locale;
    const timezone: string | undefined = req.body.timezone;

    // Validate
    if (newUser.email == null || newUser.password == null)
      return BaseController.badRequest(res);

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
        return BaseController.conflict(res, "email pending validation");
      }
    }

    let user: User;
    await User.create(newUser)
      .then((result) => {
        // We need to do another query because before the profile wasn't ready
        return User.findOne({
          where: { id: result.id },
          include: [
            { model: Profile, as: "profile" },
            { model: Role, as: "roles" },
          ],
        })
          .then((result) => {
            user = result;
            // Set extra params:
            if (locale != null) user.profile.locale = locale;
            if (timezone != null) user.profile.time_zone = timezone;
            return user.profile.save();
          })
          .then(async () => {
            if (config.emailAuth.requireEmailConfirmation) {
              // Send Email Confirmation email
              try {
                const info = await this.handleSendConfirmEmail(user.email);
                log.info(info);
              } catch (err) {
                log.error(err);
                if (err.error == "badRequest")
                  return BaseController.badRequest(res, err.msg);
                if (err.error == "notFound")
                  return BaseController.notFound(res, err.msg);
                if (err.error == "serverError")
                  return BaseController.serverError(res, err.msg);
                return BaseController.serverError(res);
              }
              return BaseController.ok(res, "Please check your email inbox.");
            }
            const credentials = authService.getCredentials(user);
            return BaseController.ok(res, credentials);
          });
      })
      .catch((err) => {
        if (
          err.errors != null &&
          err.errors.length &&
          err.errors[0].type === "unique violation" &&
          err.errors[0].path === "email"
        ) {
          return BaseController.forbidden(res, "email in use");
        } else if (err) return BaseController.serverError(res, err);
      });
  };

  @Get("/reset")
  resetGet = (req: Request, res: Response) => {
    const token: string = req.query.token as string;
    if (_.isUndefined(token)) return BaseController.unauthorized(res);
    // Decode token
    authService
      .validateJWT(token, "reset")
      .then((decodedjwt) => {
        if (decodedjwt)
          res.redirect(`${config.urls.base}/recovery/#/reset?token=${token}`);
        else BaseController.unauthorized(res);
        return null;
      })
      .catch((err) => {
        return BaseController.unauthorized(res, err);
      });
  };

  /*
    This can serve two different use cases:
      1. Request sending of recovery token via email (body: { email: '...' })
      2. Set new password (body: { token: 'mytoken', password: 'newpassword' })
  */
  @Post("/reset")
  @Middlewares([validateBody(AuthRegisterSchema)])
  resetPost = (req: Request, res: Response) => {
    // Validate if case 2
    const token: string = req.body.token;
    const password: string = req.body.password;

    if (!_.isUndefined(token) && !_.isUndefined(password)) {
      return this.handleResetChPass(token, password)
        .then((credentials) => BaseController.ok(res, credentials))
        .catch((err) => {
          log.error(err);
          if (err.error == "badRequest")
            return BaseController.badRequest(res, err.msg);
          if (err.error == "notFound")
            return BaseController.notFound(res, err.msg);
          if (err.error == "serverError")
            return BaseController.serverError(res, err.msg);
          return BaseController.serverError(res);
        });
    }

    // Validate case 1
    const email: string = req.body.email;
    if (!_.isUndefined(email)) {
      return this.handleResetEmail(email)
        .then((info) => {
          log.info(info);
          BaseController.ok(res);
        })
        .catch((err) => {
          log.error(err);
          if (err.error == "badRequest")
            return BaseController.badRequest(res, err.msg);
          if (err.error == "notFound")
            return BaseController.notFound(res, err.msg);
          if (err.error == "serverError")
            return BaseController.serverError(res, err.msg);
          return BaseController.serverError(res);
        });
    }

    return BaseController.badRequest(res);
  };

  @Post("/change")
  @Authentication()
  @Middlewares([validateBody(AuthChangeSchema)])
  changePassword = (req: Request, res: Response) => {
    const email = req.body.email;
    const oldPass = req.body.oldPass;
    const newPass = req.body.newPass;
    // Validate
    if (email == null || oldPass == null || newPass == null)
      return BaseController.badRequest(res);
    if (email.length === 0 || oldPass.length === 0 || newPass.length === 0)
      return BaseController.badRequest(res);
    // IMPORTANT: Check if email is the same as the one in the token
    if (email != req.session.jwt.email) return BaseController.unauthorized(res);

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
      .then((authenticated) => {
        if (authenticated === true) {
          results.user.password = newPass;
          return results.user.save();
        } else {
          return BaseController.unauthorized(res);
        }
      })
      .then((result) => {
        if (!result) return BaseController.serverError(res);
        const credentials = authService.getCredentials(results.user);
        return BaseController.ok(res, credentials);
      })
      .catch((err) => {
        log.error(err);
        return BaseController.badRequest(res);
      });
  };

  @Post("/refresh")
  @Authentication()
  refreshToken = (req: Request, res: Response) => {
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
      .then((user) => {
        if (!user) {
          return BaseController.unauthorized(res);
        }
        // Create new token and refresh token and send
        const credentials = authService.getCredentials(user);
        return BaseController.ok(res, credentials);
      })
      .catch((err) => {
        return BaseController.serverError(res, err);
      });
  };

  @Get("/confirm")
  @Middlewares([validateJWTOnQueryString("confirmEmail")])
  confirmEmail = async (req: Request, res: Response) => {
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
  };

  @ApiDocsRouteSummary("Resend confirm email")
  @ApiDocsSchemaRequest("resendConfirmEmailRequest", {
    type: "object",
    properties: {
      email: {
        type: "string",
        example: "example@email.com",
      },
    },
  })
  @ApiDocsSchemaResponse(
    "authLoginResponse",
    {
      type: "object",
      properties: {
        token: {
          type: "string",
          data: "Please check your email inbox.",
        },
      },
    },
    200,
  )
  @Post("/resendconfirm")
  @Middlewares([validateBody(AuthResendConfirmSchema)])
  resendConfirmEmail = async (req: Request, res: Response) => {
    const { email } = parseBody(req);

    if (email == null) {
      return BaseController.badRequest(res);
    }

    if (!config.emailAuth.requireEmailConfirmation) {
      return BaseController.notFound(res);
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
      return BaseController.notFound(res);
    }

    try {
      const info = await this.handleSendConfirmEmail(user.email);
      log.info(info);
    } catch (err) {
      log.error(err);
      if (err.error == "badRequest")
        return BaseController.badRequest(res, err.msg);
      if (err.error == "notFound") return BaseController.notFound(res, err.msg);
      if (err.error == "serverError")
        return BaseController.serverError(res, err.msg);
      return BaseController.serverError(res);
    }
    return BaseController.ok(res, "Please check your email inbox.");
  };

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

  public createToken(user: User, type: string): Token {
    const expiryUnit: moment.unitOfTime.DurationConstructor =
      config.jwt[type].expiry.unit;
    const expiryLength: number = config.jwt[type].expiry.length;
    const rolesIds = user.roles.map((role) => role.id);
    const expires = moment().add(expiryLength, expiryUnit).valueOf() / 1000;
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
      .then((info) => {
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
      .then((info) => {
        log.debug("Sending password changed email to:", user.email, info);
        return info;
      });
  }

  private handleResetEmail(email: string): Promise<any> {
    return User.findOne({
      where: { email: email },
      include: [{ model: Profile, as: "profile" }],
    })
      .then((user) => {
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
      .then((emailInfo) => {
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
    return authService
      .validateJWT(token, "reset")
      .then((decodedjwt) => {
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
          .then((user) => {
            if (!user) {
              throw { error: "unauthorized" };
            }
            results.user = user;
            user.password = password;
            return user.save();
          })
          .then((result) => {
            if (!result) {
              throw { error: "serverError", msg: null };
            }

            // Blacklist JWT asynchronously
            JWTBlacklist.create({
              token: token,
              expires: new Date(decodedjwt.exp * 1000),
            }).catch((err) => {
              log.error(err);
            });

            this.sendEmailPasswordChanged(results.user); // We send it asynchronously, we don't care if there is a mistake

            const credentials = authService.getCredentials(results.user);
            return credentials;
          })
          .catch((err) => {
            log.error(err);
            throw { error: "badRequest", msg: err };
          });
      })
      .catch((err) => {
        throw { error: "unauthorized", msg: err };
      });
  }
}

const controller = new AuthController();
export default controller;
