"use strict";
const gulp = require("gulp");
const tsc = require("gulp-typescript");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");
const spawn = require("child_process").spawn;
const shell = require("gulp-shell");
const tsAlias = require("gulp-ts-alias");
const tsProject = tsc.createProject("tsconfig.json");

// Node process
let node = null;
// Executes a node script with params
// @params: string[] -> The params you would pass to the node command
function execute(params) {
  if (node) node.kill();
  node = spawn("node", params, {
    stdio: "inherit",
  });
  node.on("close", function(code) {
    if (code === 8) {
      gulp.log("Error detected, waiting for changes...");
    }
  });
  return Promise.resolve();
}

function clean() {
  return del("dist");
}

function copyViews() {
  return gulp.src("app/views/**").pipe(gulp.dest("dist/views/"));
}

function copyLocales() {
  return gulp.src("app/locales/**").pipe(gulp.dest("dist/locales/"));
}

function compile() {
  const tsResult = gulp
    .src(["app/**/*.ts"])
    .pipe(tsAlias({ configuration: tsProject.config }))
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  return tsResult.js
    .pipe(
      sourcemaps.write(".", {
        sourceRoot: function(file) {
          return file.cwd + "/app";
        },
      }),
    )
    .pipe(gulp.dest("dist"));
}

const build = gulp.series(
  clean,
  gulp.parallel(compile, copyViews, copyLocales),
);

function doServe() {
  return execute(["--require", "source-map-support/register", "dist/main.js"]);
}
const serve = gulp.series(compile, doServe);

const cleanServe = gulp.series(
  clean,
  gulp.parallel(copyViews, copyLocales),
  serve,
);

// first time cleans and compiles, subsecuent times only compiles
function doWatch() {
  return gulp.watch("app/**/*.ts", serve);
}
const watch = gulp.series(cleanServe, doWatch);

function doSql() {
  return execute([
    "--require",
    "source-map-support/register",
    "dist/dumpDbCreate.js",
  ]);
}
const sql = gulp.series(compile, doSql);

function doSeed() {
  return execute(["--require", "source-map-support/register", "dist/seed.js"]);
}
const seed = gulp.series(compile, doSeed);

function doCleanSeed() {
  return execute([
    "--require",
    "source-map-support/register",
    "dist/cleanAndSeedDb.js",
  ]);
}
const cleanSeed = gulp.series(compile, doCleanSeed);

function doMakemigration() {
  return execute([
    "--require",
    "source-map-support/register",
    "dist/libraries/migrations/makemigration.js",
  ]);
}
const makemigration = gulp.series(compile, doMakemigration);

function doMigrate() {
  return execute([
    "--require",
    "source-map-support/register",
    "dist/libraries/migrations/migrate.js",
  ]);
}
const migrate = gulp.series(compile, doMigrate);

const test = gulp.series(build, shell.task("npm test"));

const production = gulp.series(build);

// clean up if an error goes unhandled.
process.on("exit", function() {
  if (node) node.kill();
});

module.exports = {
  clean,
  build,
  cleanServe,
  watch,
  serve,
  sql,
  seed,
  cleanSeed,
  makemigration,
  migrate,
  test,
  production,
  default: production,
};
