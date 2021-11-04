import { Strategy } from "@the-ksquare-group/passport-microsoft";
import passport from "passport";
import { config } from "@/config";
import { IdentityProvider } from "@/policies/Authentication";

class MicrosoftLoginService {
  public init() {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    passport.use(
      IdentityProvider.Microsoft,
      new Strategy(
        {
          authorizationURL: `https://login.microsoftonline.com/${config.auth.microsoft.tenantID}/oauth2/v2.0/authorize`,
          tokenURL: `https://login.microsoftonline.com/${config.auth.microsoft.tenantID}/oauth2/v2.0/token`,
          clientID: config.auth.microsoft.clientID,
          clientSecret: config.auth.microsoft.clientSecret,
          callbackURL: config.auth.microsoft.callbackURL,
          scope: ["user.read"],
        },
        function(_accessToken, _refreshToken, profile, done) {
          process.nextTick(() => done(null, profile));
        },
      ),
    );

    passport.use(
      IdentityProvider.MicrosoftRegister,
      new Strategy(
        {
          authorizationURL: `https://login.microsoftonline.com/${config.auth.microsoft.tenantID}/oauth2/v2.0/authorize`,
          tokenURL: `https://login.microsoftonline.com/${config.auth.microsoft.tenantID}/oauth2/v2.0/token`,
          clientID: config.auth.microsoft.clientID,
          clientSecret: config.auth.microsoft.clientSecret,
          callbackURL: config.auth.microsoft.registerCallbackURL,
          scope: ["user.read"],
        },
        function(_accessToken, _refreshToken, profile, done) {
          process.nextTick(() => done(null, profile));
        },
      ),
    );
  }
}

const microsoftLoginService = new MicrosoftLoginService();
export default microsoftLoginService;
