import { NextFunction, Request, Response } from "express";
import passport from "passport";

export enum IdentityProvider {
  Microsoft = "microsoft",
  MicrosoftRegister = "microsoft-register",
  Google = "google",
  GoogleRegister = "google-register",
}

export function authenticateSSO(identityProvider: IdentityProvider) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Always show account selector screen (Works for Google SSO and MS SSO)
    passport.authenticate(identityProvider, { prompt: "select_account" })(
      req,
      res,
      next,
    );
  };
}

export function authenticateSSOCallback(identityProvider: IdentityProvider) {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(identityProvider, { failureRedirect: "/login" })(
      req,
      res,
      next,
    );
  };
}
