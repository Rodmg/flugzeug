require("dotenv").config();
process.env.DB_NAME = "app-backend-test";

import chai from "chai";
import authService, { JWTPayload } from "@/services/AuthService";
import { setUpTestDB } from "../util";
import { number } from "joi";
import { log } from "@/libraries/Log";
import { JWTBlacklist } from "@/submodules/src/context/JWTBlacklist/model/JWTBlacklist";
import { TokenExpiredError } from "jsonwebtoken";

describe("Test basic app unit test", () => {
  before(async () => {
    await setUpTestDB();
    log.info("app-backend-test database is ready!");
  });

  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1wbG95ZWVJZCI6OSwic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MTY1NzIxMjA3NS4zMTYsImlhdCI6MTY1NDYyMDA3NS4zMTYsImp0aSI6IjNiYjg3NGNkLTc4NjQtNDYwNy05YWY1LTcyY2VkZTY0NTU1ZCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WzVdfQ.vazduQLO0O2pwVrcj2cN1YYbNocaFCtzmyKfcr8XhBQ";
  const jwtBody = {
    id: 1,
    employeeId: 9,
    sub: "access",
    aud: "user",
    exp: 1657212075.316,
    iat: 1654620075.316,
    jti: "3bb874cd-7864-4607-9af5-72cede64555d",
    email: "admin@example.com",
    roles: [5],
  };
  const tokenExpired =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1wbG95ZWVJZCI6OSwic3ViIjoiYWNjZXNzIiwiYXVkIjoidXNlciIsImV4cCI6MC4zMTYsImlhdCI6MTY1NDYyMDA3NS4zMTYsImp0aSI6IjNiYjg3NGNkLTc4NjQtNDYwNy05YWY1LTcyY2VkZTY0NTU1ZCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WzVdfQ.Zbt50VpQ7UIC1_3oC9uBVq3aDax227sDlOgtLEFflLc";

  describe("#validateJWT()", () => {
    it("should be destructure jwt property a get token info", async () => {
      let jwt;
      try {
        jwt = await authService.validateJWT(token, "access");
      } catch (e) {
        jwt = null;
      }
      chai.expect(jwt).to.be.deep.equal(jwtBody);
    });

    it("should be object type", async () => {
      let jwt;
      try {
        jwt = await authService.validateJWT(token, "access");
      } catch (e) {
        jwt = null;
      }
      chai.expect(jwt).to.be.an("object");
    });

    it("should throw an error 'TokenExpiredError' because it expired", async () => {
      try {
        await authService.validateJWT(tokenExpired, "access");
      } catch (e) {
        chai.expect(e).to.be.instanceOf(TokenExpiredError);
        chai.expect(e.message).to.eql("jwt expired");
      }
    });
  });
});
