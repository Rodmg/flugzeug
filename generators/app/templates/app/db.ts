
import * as Sequelize from 'sequelize';
import { log } from './libraries/Log';
import * as _ from 'lodash';
import { config } from './config/config';

let dbOptions = {
  define: {
    freezeTableName: true,
    instanceMethods: {
      toJSON() {
        let object = _.clone(this.dataValues);
        delete object.createdAt;
        delete object.updatedAt;
        return object;
      }
    }
  }
};
dbOptions = _.merge(dbOptions, config.db.options);
export const db = new Sequelize(config.db.name, config.db.user, config.db.password, dbOptions);

function setupAssociations(model) {
  let asocs: any = {};
  if(model.getAssociations != null) asocs = model.getAssociations();
  for(let k of Object.keys(asocs)) {
    let asoc = asocs[k];
    let options = _.omit(asoc, ['type', 'model']);
    if(model[asoc.type] != null) model[asoc.type](asoc.model, options);
    else log.warn('Invalid association type for model:', k, asoc);
  }
}

// Should be called in server
export function setupDB(): Promise<any> {
  let models = Object.keys(db.models).map((k) => db.models[k]);
  for(let model of models) {
    setupAssociations(model);
  }

  // Uncomment parameter for logging CREATE TABLE queries
  return Promise.resolve(db.sync(/*{ logging: console.log }*/));
}