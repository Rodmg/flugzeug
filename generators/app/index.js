"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const boxen = require("boxen");
const base64url = require("base64-url");
const crypto = require("crypto");
const path = require("path");
const mkdirp = require("mkdirp");
const _ = require("lodash");
const pjson = require("./../../package.json");

const logo = `                                 
  _____ _                         
 |   __| |_ _ ___ ___ ___ _ _ ___ 
 |   __| | | | . |- _| -_| | | . |
 |__|  |_|___|_  |___|___|___|_  |
             |___|           |___|
 v${pjson.version}
`;

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.createdFolder = false;

    this.argument("name", {
      type: String,
      required: false,
      description: "Your project name",
    });
  }

  _makeName(name) {
    name = _.kebabCase(name);
    return name;
  }

  prompting() {
    this.log(
      logo + "\nWelcome to the " + chalk.red("Flugzeug") + " generator\n",
    );

    if (this.options.name != null) {
      this.appname = this.options.name;
    }

    const gitName = this.user.git.name();
    const gitEmail = this.user.git.email();
    const defaultAuthor = `${gitName || "Me"} <${gitEmail ||
      "me@example.com"}>`;

    const prompts = [
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this._makeName(this.appname),
        filter: this._makeName,
      },
      {
        type: "input",
        name: "author",
        message: "Author:",
        default: defaultAuthor,
        store: true,
      },
      {
        type: "list",
        name: "dbtype",
        message: "Database type:",
        default: "sqlite",
        choices: [
          { name: "SQLite", value: "sqlite" },
          { name: "MySQL", value: "mysql" },
          { name: "PostgreSQL", value: "postgres" },
        ],
      },
      {
        type: "input",
        name: "dbname",
        message: "Database name:",
        default: this._makeName(this.appname),
        filter: this._makeName,
        when: props => props.dbtype === "mysql" || props.dbtype === "postgres",
      },
      {
        type: "confirm",
        name: "websockets",
        message: "Use websockets?",
        default: false,
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  default() {
    if (path.basename(this.destinationPath()) !== this.props.name) {
      this.log(
        `Your project must be inside a folder named ${this.props.name}\nI'll automatically create this folder.`,
      );
      mkdirp(this.props.name);
      this.destinationRoot(this.destinationPath(this.props.name));
      this.createdFolder = true;
      this.config.save();
    }
  }

  _generateJwtSecret() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(32, (err, buf) => {
        if (err) return reject(err);
        this.token = base64url.encode(buf);
        return resolve(this.token);
      });
    });
  }

  writing() {
    // Copy all non-template files
    this.fs.copy(this.templatePath("**/*"), this.destinationPath(""), {
      globOptions: {
        dot: true,
        ignore: ["**/*.template"],
      },
    });

    // Copy templates
    this.fs.copyTpl(
      this.templatePath(".gitignore.template"),
      this.destinationPath(".gitignore"),
      {},
    );
    this.fs.copyTpl(
      this.templatePath("package.json.template"),
      this.destinationPath("package.json"),
      {
        name: this.props.name,
        flugzeugVersion: pjson.version,
        author: this.props.author,
        useWebsockets: this.props.websockets,
        dbtype: this.props.dbtype,
      },
    );
    this.fs.copyTpl(
      this.templatePath("README.md.template"),
      this.destinationPath("README.md"),
      {
        name: this.props.name,
      },
    );

    this.fs.copyTpl(
      this.templatePath("app/main.ts.template"),
      this.destinationPath("app/main.ts"),
      { useWebsockets: this.props.websockets },
    );
    this.fs.copyTpl(
      this.templatePath("app/server.ts.template"),
      this.destinationPath("app/server.ts"),
      { name: this.props.name },
    );
    if (this.props.websockets)
      this.fs.copyTpl(
        this.templatePath("app/sockets.ts.template"),
        this.destinationPath("app/sockets.ts"),
        {},
      );

    this._generateJwtSecret()
      .then(secret => {
        this.fs.copyTpl(
          this.templatePath("app/config/index.ts.template"),
          this.destinationPath("app/config/index.ts"),
          {
            dbtype: this.props.dbtype,
            dbname: this.props.dbname,
            jwt_secret: secret,
          },
        );
        this.fs.copyTpl(
          this.templatePath(".env.template"),
          this.destinationPath(".env"),
          {
            dbtype: this.props.dbtype,
            dbname: this.props.dbname,
            jwt_secret: secret,
          },
        );
        this.fs.copyTpl(
          this.templatePath(".env.example.template"),
          this.destinationPath(".env.example"),
          {
            dbtype: this.props.dbtype,
            dbname: this.props.dbname,
            jwt_secret: secret,
          },
        );
      })
      .catch(err => {
        this.log("Error generating JWT secret", err);
      });

    this.fs.copyTpl(
      this.templatePath("app/libraries/Log.ts.template"),
      this.destinationPath("app/libraries/Log.ts"),
      { name: this.props.name },
    );
  }

  install() {
    this.installDependencies({
      npm: true,
      bower: false,
      yarn: false,
    });
  }

  end() {
    // Make sure code is correctly formatted after generation
    this.spawnCommandSync("npm", ["run", "format"]);
    // Initialize git repo
    this.spawnCommandSync("git", ["init", "--quiet"]);
    this.spawnCommandSync("git", ["add", "."]);
    this.spawnCommandSync("git", ["commit", "-m", "Initial Project Setup"]);

    const content = `${chalk.green("Your project is ready!")}
For instructions on how to get started, please see README.md
Run it with:
${
  this.createdFolder
    ? "\n  " + chalk.blue("cd ") + chalk.blue(this.props.name)
    : ""
}
  ${chalk.blue("npm run watch")}`;
    const msg = boxen(content, { padding: 1, borderStyle: "round" });
    this.log(msg);
  }
};
