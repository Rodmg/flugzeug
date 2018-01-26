'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const changeCase = require('change-case');

module.exports = class extends Generator {
  prompting() {
    this.log('\nWelcome to the ' + chalk.red('Flugzeug Service') + ' generator\n');

    const prompts = [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service name:',
        default: 'MyService',
        filter: changeCase.pascalCase
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
      this.props.serviceInstanceName = changeCase.camelCase(props.serviceName);
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('serviceTemplate.ts'),
      this.destinationPath(`app/services/${this.props.serviceName}.ts`),
      this.props
    );
  }
};
