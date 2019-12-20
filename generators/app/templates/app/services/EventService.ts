/*
  EventService
    Manages events.
 */

import { EventEmitter } from "events";
import { db } from "@/db";

class EventService extends EventEmitter {
  constructor() {
    super();
  }

  init() {
    // Setup model change events
    db.addHook("afterUpdate", (instance: any, _options: any) => {
      const changed = instance._changed;
      const changes = {};

      for (const k in changed) {
        if (changed.hasOwnProperty(k)) {
          changes[k] = instance[k];
        }
      }

      if (instance.userId) {
        this.emit(`db/update/${instance.userId}`, {
          model: instance._modelOptions.name.singular,
          id: instance.id,
          changed: changes,
        });
        this.emit(`db/change/${instance.userId}`, {
          event: "update",
          model: instance._modelOptions.name.singular,
          id: instance.id,
          changed: changes,
        });
      }
    });

    // db.addHook('afterBulkUpdate', (instance: any, options: any) => {
    //   // Called multiple times...
    //   console.log('DB event BulkUpd:', instance);
    // });

    db.addHook("afterDestroy", (instance: any, _options: any) => {
      if (instance.userId) {
        this.emit(`db/destroy/${instance.userId}`, {
          model: instance._modelOptions.name.singular,
          id: instance.id,
        });
        this.emit(`db/change/${instance.userId}`, {
          event: "destroy",
          model: instance._modelOptions.name.singular,
          id: instance.id,
        });
      }
    });

    db.addHook("afterCreate", (instance: any, _options: any) => {
      if (instance.userId) {
        this.emit(`db/create/${instance.userId}`, {
          model: instance._modelOptions.name.singular,
          id: instance.id,
        });
        this.emit(`db/change/${instance.userId}`, {
          event: "create",
          model: instance._modelOptions.name.singular,
          id: instance.id,
        });
      }
    });
  }
}

const eventService = new EventService();
export default eventService;
