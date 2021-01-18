#!/usr/bin/env node

import fs from "fs";
import path from "path";
import moment from "moment";
import _ from "lodash";
import { db } from "@/db";
import {
  sortActions,
  reverseModels,
  parseDifference,
  writeMigration,
  getMigration,
} from "./migrationGenerator";

const MIGRATIONS_DIR = path.join(__dirname, "../../../app/migrations");

async function main() {
  const timestamp = moment().format("YYYYMMDDHHmmss");

  // current state
  const currentState: any = {
    tables: {},
  };

  // load last state
  let previousState = {
    revision: timestamp,
    version: 1,
    tables: {},
  };

  try {
    previousState = JSON.parse(
      fs
        .readFileSync(path.join(MIGRATIONS_DIR, "currentSchema.json"))
        .toString(),
    );
  } catch (err) {
    // First time, do nothing
  }

  const sequelize = {
    models: db.models,
  };

  const models = sequelize.models;

  currentState.tables = reverseModels(sequelize, models);
  const actions = parseDifference(previousState.tables, currentState.tables);

  // sort actions
  sortActions(actions);
  const migration = getMigration(actions);
  if (migration.commandsUp.length === 0) {
    console.log("No changes found");
    process.exit(0);
  }

  // log migration actions
  _.each(migration.consoleOut, v => {
    console.log("[Actions] " + v);
  });

  // save current state
  currentState.revision = timestamp;
  fs.writeFileSync(
    path.join(MIGRATIONS_DIR, "currentSchema.json"),
    JSON.stringify(currentState, null, 2),
  );

  // write migration to file
  const info = await writeMigration(
    currentState.revision,
    migration,
    MIGRATIONS_DIR,
    "migration",
    "",
  );

  console.log(
    `New migration to revision ${currentState.revision} has been saved to file '${info.filename}'`,
  );

  process.exit(0);
}

main();
