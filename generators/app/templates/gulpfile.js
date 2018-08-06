"use strict";
var gulp = require("gulp");
var tsc = require("gulp-typescript");
var del = require("del");
var sourcemaps = require("gulp-sourcemaps");
var path = require("path");
var spawn = require("child_process").spawn;
var runSequence = require("run-sequence");
var shell = require("gulp-shell");

// Node process
var node = null;

var tsProject = tsc.createProject("tsconfig.json");

gulp.task("clean", function(cb) {
  return del("dist", cb);
});

gulp.task("compile", function() {
  var tsResult = gulp
    .src(["app/**/*.ts"])
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  return tsResult.js
    .pipe(
      sourcemaps.write(".", {
        sourceRoot: function(file) {
          return file.cwd + "/app";
        }
      })
    )
    .pipe(gulp.dest("dist"));
});

gulp.task("build", function(cb) {
  runSequence("clean", "compile", "copy-views", "copy-locales", cb);
});

gulp.task("clean-serve", function(cb) {
  runSequence("clean", "copy-views", "copy-locales", "serve", cb);
});

// first time cleans and compiles, subsecuent times only compiles
gulp.task("watch", ["clean-serve"], function() {
  gulp.watch("app/**/*.ts", ["serve"]);
});

gulp.task("copy-views", function() {
  return gulp.src("app/views/**").pipe(gulp.dest("dist/views/"));
});

gulp.task("copy-locales", function() {
  return gulp.src("app/locales/**").pipe(gulp.dest("dist/locales/"));
});

gulp.task("serve", ["compile"], function() {
  if (node) node.kill();
  node = spawn("node", ["--require", "source-map-support/register", "dist/main.js"], {
    stdio: "inherit"
  });
  node.on("close", function(code) {
    if (code === 8) {
      gulp.log("Error detected, waiting for changes...");
    }
  });
});

gulp.task("sql", ["compile"], function() {
  if (node) node.kill();
  node = spawn("node", ["--require", "source-map-support/register", "dist/dumpDbCreate.js"], {
    stdio: "inherit"
  });
  node.on("close", function(code) {
    if (code === 8) {
      gulp.log("Error detected, waiting for changes...");
    }
  });
});

gulp.task("seed", ["compile"], function() {
  if (node) node.kill();
  node = spawn("node", ["--require", "source-map-support/register", "dist/seed.js"], {
    stdio: "inherit"
  });
  node.on("close", function(code) {
    if (code === 8) {
      gulp.log("Error detected, waiting for changes...");
    }
  });
});

gulp.task("test", ["build"], shell.task("npm test"));

gulp.task("production", ["build"]);

gulp.task("default", ["production"]);

// clean up if an error goes unhandled.
process.on("exit", function() {
  if (node) node.kill();
});
