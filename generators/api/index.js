"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const changeCase = require("change-case");

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
    this.argument("name", {
      type: String,
      required: false,
      description: "Your api name",
    });
  }

  prompting() {
    this.log("\nWelcome to the " + chalk.red("Flugzeug API") + " generator\n");

    // Set default api name to the name passed as arguments
    let defaultApiName = "Thing";
    if (this.options.name != null) {
      defaultApiName = changeCase.pascalCase(this.options.name);
    }

    let opts = { apiName: defaultApiName };

    this.composeWith(require.resolve("../model"), { silent: true, opts });
    this.composeWith(require.resolve("../controller"), { silent: true, opts });
  }
};
