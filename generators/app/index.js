'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const base64url = require('base64-url');
const crypto = require('crypto');
const _ = require('lodash');

const logo = '                                 \r\n _____ _                         \r\n|   __| |_ _ ___ ___ ___ _ _ ___ \r\n|   __| | | | . |- _| -_| | | . |\r\n|__|  |_|___|_  |___|___|___|_  |\r\n            |___|           |___|';

module.exports = class extends Generator {
  makeName(name) {
    name = _.kebabCase(name);
    return name;
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(logo + '\n\nWelcome to the ' + chalk.red('Flugzeug') + ' generator\n');

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Your project name',
        default: this.makeName(this.appname),
        filter: this.makeName
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: 'Me <me@example.com>'
      },
      {
        type: 'input',
        name: 'dbname',
        message: 'MySQL Database name:',
        default: 'flugzeug-project'
      },
      {
        type: 'confirm',
        name: 'websockets',
        message: 'Use websockets?',
        default: false
      },
      {
        type: 'confirm',
        name: 'mqtt',
        message: 'Use MQTT?',
        default: false
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.log(props);
      this.props = props;
    });
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
    this.fs.copy(this.templatePath(''), this.destinationPath(''), {
      globOptions: {
        dot: true,
        ignore: '**/*.template'
      }
    });

    // Copy templates
    this.fs.copyTpl(
      this.templatePath('package.json.template'),
      this.destinationPath('package.json'),
      {
        name: this.props.name,
        author: this.props.author,
        useMqtt: this.props.mqtt,
        useWebsockets: this.props.websockets
      }
    );
    this.fs.copyTpl(
      this.templatePath('README.md.template'),
      this.destinationPath('README.md'),
      { name: this.props.name }
    );

    this.fs.copyTpl(
      this.templatePath('app/main.ts.template'),
      this.destinationPath('app/main.ts'),
      { useMqtt: this.props.mqtt, useWebsockets: this.props.websockets }
    );
    this.fs.copyTpl(
      this.templatePath('app/server.ts.template'),
      this.destinationPath('app/server.ts'),
      { name: this.props.name }
    );
    if (this.props.websockets)
      this.fs.copyTpl(
        this.templatePath('app/sockets.ts.template'),
        this.destinationPath('app/sockets.ts'),
        {}
      );

    this._generateJwtSecret()
      .then(secret => {
        this.fs.copyTpl(
          this.templatePath('app/config/config.ts.template'),
          this.destinationPath('app/config/config.ts'),
          { dbname: this.props.dbname, jwt_secret: secret }
        );
        this.fs.copyTpl(
          this.templatePath('.env.template'),
          this.destinationPath('.env'),
          { dbname: this.props.dbname, jwt_secret: secret }
        );
        this.fs.copyTpl(
          this.templatePath('.env.example.template'),
          this.destinationPath('.env.example'),
          { dbname: this.props.dbname, jwt_secret: secret }
        );
      })
      .catch(err => {
        this.log('Error generating JWT secret', err);
      });

    this.fs.copyTpl(
      this.templatePath('app/libraries/Log.ts.template'),
      this.destinationPath('app/libraries/Log.ts'),
      { name: this.props.name }
    );

    if (this.useMqtt)
      this.fs.copyTpl(
        this.templatePath('app/services/MqttClient.ts.template'),
        this.destinationPath('app/services/MqttClient.ts'),
        {}
      );
  }

  install() {
    this.installDependencies({
      npm: true,
      bower: false,
      yarn: false
    });
  }
};
