'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const changeCase = require('change-case');

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
    this.silent = options.silent || false;
    this.opts = options.opts || {};
  }

  prompting() {
    if (!this.silent)
      this.log('\nWelcome to the ' + chalk.red('Flugzeug Model') + ' generator\n');

    const prompts = [
      {
        type: 'input',
        name: 'modelName',
        message: 'Model name:',
        default: 'Thing',
        filter: changeCase.pascalCase
      },
      {
        type: 'confirm',
        name: 'belongsToUser',
        message: 'Would you like your model to belong to User?',
        default: true
      }
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
      this.templatePath('modelTemplate.ts'),
      this.destinationPath(`app/models/${this.props.modelName}.ts`),
      this.props
    );
  }
};
