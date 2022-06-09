import { Client } from "pg";
import { config } from "@/config";
import { setupDBClearData } from "@/db";
import { seed } from "@/seedData";

export function wait(ms) {
  return new Promise((r, _) => setTimeout(r, ms));
}

export async function createDB() {
  const connection = new Client({
    host: config.db.host,
    user: config.db.username,
    password: config.db.password,
  });

  await connection.connect();

  try {
    await connection.query(`DROP DATABASE IF EXISTS "${config.db.database}"`);
    await connection.query(`CREATE DATABASE "${config.db.database}"`);
  } catch (err) {
    if (err) throw err;
  }

  await connection.end();
}

export async function addExtensions() {
  const connection = new Client({
    host: config.db.host,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
  });

  await connection.connect();

  try {
    await connection.query(`DROP EXTENSION IF EXISTS pgcrypto`);
    await connection.query(`CREATE EXTENSION pgcrypto`);
  } catch (err) {
    if (err) throw err;
  }

  await connection.end();
}

export const setUpTestDB = async () => {
  await createDB();
  await addExtensions();
  await setupDBClearData();
  await seed();
};
