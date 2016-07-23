'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var shell = require('gulp-shell');
var rename = require("gulp-rename");
var jsoncovToLcov = require('json2lcov');
var fs = require('fs');

gulp.task('watch', function() {
  gulp.start('sass')
  gulp.watch('./scss/**/*.scss', ['sass']);
});

gulp.task('default', function() {
  gulp.start('sass', 'compress', 'test', 'coverage');
});

gulp.task('sass', function () {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

gulp.task('concat', function() {
  return gulp.src(['./src/NovelManager.js','./src/InputManager.js','./src/Parser.js','./src/InventoryManager.js','./src/LanguageManager.js','./src/SceneManager.js','./src/SoundManager.js','./src/TextPrinter.js','./src/UI.js','./src/Util.js','./src/Init.js'])
    .pipe(concat('novel.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('test-concat', function() {
  return gulp.src(['./test/src/Init.js','./test/src/Parser-test.js','./test/src/InventoryManager-test.js','./test/src/Util-test.js'])
    .pipe(concat('test.js'))
    .pipe(gulp.dest('./test'));
});

gulp.task('compress', ['concat'], function() {
  return gulp.src('./novel.js')
    .pipe(uglify())
    .pipe(rename('novel.min.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('test', ['concat','test-concat'], shell.task([
  'jscover ./ cov',
  'mocha-phantomjs cov/test/index.html -R json-cov > report.json',
]));

gulp.task('coverage', ['test'], function() {
  var json = JSON.parse(fs.readFileSync('report.json','utf8'));
  delete json.files[1];
  fs.writeFileSync('coverage.lcov',jsoncovToLcov(json))
});
