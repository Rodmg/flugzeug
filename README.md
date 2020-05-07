# Flugzeug /ˈfluːktsɔʏ̯k/ ✈️

> Flugzeug Framework

Lightweight backend framework for Node.js, based on TypeScript, Express and Sequelize.

More details: [Documentation](generators/app/templates/docs/Framework.md)

## Installation

First, install [Yeoman](http://yeoman.io) and generator-flugzeug using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo generator-flugzeug
```

Then generate your new project:

```bash
flug app my-project
```

**Please note:** If you are using MySQL, don't forget to manually create the database with the name you specified when creating your project. Also please update your database access credentials on the `.env` file in the root of the project if needed.

## Available generators

Run any inside your project folder:

```
flug api
flug model
flug controller
flug service
```

## Development

For testing the generator during development, use:

```
npm link
```

## License

MIT © [Rodrigo Méndez Gamboa](http://rodrigomendez.me)
