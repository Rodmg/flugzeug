import { Strategy } from "passport-google-oauth20";
import passport from "passport";
import { config } from "@/config";
import { IdentityProvider } from "@/policies/Authentication";

class GoogleLoginService {
  public init() {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    passport.use(
      IdentityProvider.Google,
      new Strategy(
        {
          clientID: config.auth.google.clientID,
          clientSecret: config.auth.google.clientSecret,
          callbackURL: config.auth.google.callbackURL,
          scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
          ],
        },
        function(_accessToken, _refreshToken, profile, done) {
          process.nextTick(() => done(null, profile));
        },
      ),
    );

    passport.use(
      IdentityProvider.GoogleRegister,
      new Strategy(
        {
          clientID: config.auth.google.clientID,
          clientSecret: config.auth.google.clientSecret,
          callbackURL: config.auth.google.registerCallbackURL,
          scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
          ],
        },
        function(_accessToken, _refreshToken, profile, done) {
          process.nextTick(() => done(null, profile));
        },
      ),
    );
  }
}

const googleLoginService = new GoogleLoginService();
export default googleLoginService;
