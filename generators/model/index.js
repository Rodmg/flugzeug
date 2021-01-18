"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const changeCase = require("change-case");

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
    this.silent = options.silent || false;
    this.opts = options.opts || {};

    this.argument("name", {
      type: String,
      required: false,
      description: "Your model name",
    });
  }

  prompting() {
    if (!this.silent)
      this.log(
        "\nWelcome to the " + chalk.red("Flugzeug Model") + " generator\n",
      );

    // Set default model name to the name passed as arguments
    let defaultModelName =
      this.opts.apiName == null ? "Thing" : this.opts.apiName;
    if (this.options.name != null) {
      defaultModelName = changeCase.pascalCase(this.options.name);
    }

    const prompts = [
      {
        type: "input",
        name: "modelName",
        message: "Model name:",
        default: defaultModelName,
        filter: changeCase.pascalCase,
      },
      {
        type: "confirm",
        name: "belongsToUser",
        message: "Would you like your model to belong to User?",
        default: true,
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
      this.props.tableName = props.modelName.toLowerCase();
      // Copy props to opts to expose to other composed generators
      Object.assign(this.opts, this.props);
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath("modelTemplate.ts"),
      this.destinationPath(`app/models/${this.props.modelName}.ts`),
      this.props,
    );
  }

  end() {
    // Make sure code is correctly formatted after generation
    this.spawnCommandSync("npx", [
      "prettier",
      "--write",
      `app/models/${this.props.modelName}.ts`,
    ]);
  }
};
