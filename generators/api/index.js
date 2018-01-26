'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');

module.exports = class extends Generator {
  prompting() {
    this.log('\nWelcome to the ' + chalk.red('Flugzeug API') + ' generator\n');

    let opts = {};

    this.composeWith(require.resolve('../model'), { silent: true, opts });
    this.composeWith(require.resolve('../controller'), { silent: true, opts });
  }
};
