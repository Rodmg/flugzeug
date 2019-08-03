"use strict";
const Generator = require("yeoman-generator");
const p = require("./../../package.json");

module.exports = class extends Generator {
  prompting() {
    this.log("\nFlugzeug Version: " + p.version + "\n");
  }
};
