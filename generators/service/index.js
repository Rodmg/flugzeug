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
      description: "Your service name",
    });
  }

  prompting() {
    this.log(
      "\nWelcome to the " + chalk.red("Flugzeug Service") + " generator\n",
    );

    // Set default service name to the name passed as arguments
    let defaultServiceName = "MyService";
    if (this.options.name != null) {
      defaultServiceName = changeCase.pascalCase(this.options.name);
    }

    const prompts = [
      {
        type: "input",
        name: "serviceName",
        message: "Service name:",
        default: defaultServiceName,
        filter: changeCase.pascalCase,
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
      this.props.serviceInstanceName = changeCase.camelCase(props.serviceName);
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath("serviceTemplate.ts"),
      this.destinationPath(`app/services/${this.props.serviceName}.ts`),
      this.props,
    );
  }

  end() {
    // Make sure code is correctly formatted after generation
    this.spawnCommandSync("npx", [
      "prettier",
      "--write",
      `app/services/${this.props.serviceName}.ts`,
    ]);
  }
};
