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
      description: "Your controller name",
    });
  }

  prompting() {
    if (!this.silent)
      this.log(
        "\nWelcome to the " + chalk.red("Flugzeug Controller") + " generator\n",
      );

    // Set default controller name to the name passed as arguments if opts.modelName is not present
    if (this.opts.modelName == null && this.options.name != null) {
      this.opts.modelName = changeCase.pascalCase(this.options.name);
    }

    const prompts = [
      {
        type: "input",
        name: "controllerName",
        message: "Controller name:",
        default: this.opts.modelName == null ? "Thing" : this.opts.modelName,
        filter: changeCase.pascalCase,
      },
      {
        type: "input",
        name: "modelName",
        message: "Model:",
        default: props => {
          return this.opts.modelName == null
            ? props.controllerName
            : this.opts.modelName;
        },
        when: this.opts.modelName == null,
      },
      {
        type: "input",
        name: "apiVersion",
        message: "API Version:",
        default: "v1",
      },
      {
        type: "confirm",
        name: "needsAuth",
        message: "Needs authentication?",
        default: true,
      },
      {
        type: "confirm",
        name: "belongsToUser",
        message: "Does the model belongs to User?",
        default: props => {
          return this.opts.belongsToUser == null
            ? props.needsAuth
            : this.opts.belongsToUser;
        },
        when: this.opts.belongsToUser == null,
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
      this.props.pathName = props.controllerName.toLowerCase();
      if (this.opts.modelName != null)
        this.props.modelName = this.opts.modelName;
      if (this.opts.belongsToUser != null)
        this.props.belongsToUser = this.opts.belongsToUser;
      // Copy props to opts to expose to other composed generators
      Object.assign(this.opts, this.props);
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath("controllerTemplate.ts"),
      this.destinationPath(
        `app/controllers/${this.props.apiVersion}/${this.props.controllerName}.ts`,
      ),
      this.props,
    );
  }

  end() {
    // Make sure code is correctly formatted after generation
    this.spawnCommandSync("npx", [
      "prettier",
      "--write",
      `app/controllers/${this.props.apiVersion}/${this.props.controllerName}.ts`,
    ]);
  }
};
