/*
  AuthService
    Shared Auth logic

  Business logic:
    Used on Auth controllers for managing JWTs
*/

import _ from "lodash";
import jwt from "jsonwebtoken";
import moment from "moment";
import uuid from "uuid";
import { config } from "@/config";
import { JWTBlacklist } from "@/models/JWTBlacklist";
import { Profile } from "@/models/Profile";
import { User } from "@/models/User";
import { Role } from "@/models/Role";

export interface Token {
  token: string;
  expires: number;
  expires_in: number;
}

export interface AuthCredentials {
  token: string;
  expires: number;
  refresh_token: Token;
  user: Pick<User, "id" | "name" | "email">;
  profile: Profile;
  roles: Role[];
}

export interface JWTPayload {
  id: number;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nbf?: number;
  jti: string;
  email: string;
  roles: string[];
}

class AuthService {
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

  public getCredentials(user: User): AuthCredentials {
    // Prepare response object
    const token = this.createToken(user, "access");
    const refreshToken = this.createToken(user, "refresh");
    const credentials = {
      token: token.token,
      expires: token.expires,
      refresh_token: refreshToken,
      user: _.pick(user, ["id", "name", "email"]),
      profile: user.profile,
      roles: user.roles,
    };
    return credentials;
  }

  public getExchangeToken(user: User): string {
    const token = this.createToken(user, "exchange");
    return token.token;
  }

  public async validateJWT(token: string, type: string): Promise<JWTPayload> {
    // Decode token
    let decodedjwt: JWTPayload;
    try {
      decodedjwt = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (err) {
      throw err;
    }
    const reqTime = Date.now() / 1000;
    // Check if token expired
    if (decodedjwt.exp <= reqTime) {
      throw "Token expired";
    }
    // Check if token is early
    if (!_.isUndefined(decodedjwt.nbf) && reqTime <= decodedjwt.nbf) {
      throw "This token is early.";
    }

    // If audience doesn't match
    if (config.jwt[type].audience !== decodedjwt.aud) {
      throw "This token cannot be accepted for this domain.";
    }

    // If the subject doesn't match
    if (config.jwt[type].subject !== decodedjwt.sub) {
      throw "This token cannot be used for this request.";
    }

    // Check if blacklisted
    try {
      const result = await JWTBlacklist.findOne({ where: { token: token } });
      // if exists in blacklist, reject
      if (result != null) throw "This Token is blacklisted.";
      return decodedjwt;
    } catch (err) {
      throw err;
    }
  }
}

const authService = new AuthService();
export default authService;
