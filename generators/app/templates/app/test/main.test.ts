require("dotenv").config();
// Force test database
process.env.DB_NAME = "app-backend-test";

import { describe, it } from "mocha";
import { expect } from "chai";
import { setupServer } from "@/server";

describe("Test general app health", function() {
  it("should load server deps correctly", async function() {
    // Usually catches error on Swagger Yaml syntax
    expect(setupServer).to.exist;
  });
});
