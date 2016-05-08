'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var shell = require('gulp-shell');
var rename = require("gulp-rename");
var jsoncovToLcov = require('json2lcov');
var fs = require('fs');
var del = require('del');

gulp.task('watch', function() {
  gulp.start('sass')
  gulp.watch('./scss/**/*.scss', ['sass']);
  gulp.watch('./src/*.coffee', ['coffee']);
  gulp.watch('./test/src/*.coffee', ['test-coffee']);
});

gulp.task('default', function() {
  gulp.start('sass', 'coffee', 'test-coffee', 'compress', 'test', 'coverage', 'clean');
});

gulp.task('sass', function () {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

gulp.task('concat', function() {
  return gulp.src(['./src/NovelManager.coffee','./src/InputManager.coffee','./src/Parser.coffee','./src/InventoryManager.coffee','./src/LanguageManager.coffee','./src/SceneManager.coffee','./src/SoundManager.coffee','./src/TextPrinter.coffee','./src/UI.coffee','./src/Util.coffee','./src/Init.coffee'])
    .pipe(concat('novel.coffee'))
    .pipe(gulp.dest('./'));
});

gulp.task('test-concat', function() {
  return gulp.src(['./test/src/Init.coffee','./test/src/Parser-test.coffee','./test/src/InventoryManager-test.coffee','./test/src/Util-test.coffee'])
    .pipe(concat('test.coffee'))
    .pipe(gulp.dest('./test'));
});

gulp.task('coffee', ['concat'], function() {
  return gulp.src('./novel.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('test-coffee', ['test-concat'], function() {
  return gulp.src('./test/test.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./test'));
});

gulp.task('compress', ['coffee'], function() {
  return gulp.src('./novel.js')
    .pipe(uglify())
    .pipe(rename('novel.min.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('test', ['coffee','test-coffee'], shell.task([
  'jscover ./ cov',
  'mocha-phantomjs cov/test/index.html -R json-cov > report.json',
]));

gulp.task('coverage', ['test'], function() {
  var json = JSON.parse(fs.readFileSync('report.json','utf8'));
  delete json.files[1];
  fs.writeFileSync('coverage.lcov',jsoncovToLcov(json))
});

gulp.task('clean', function() {
  return del([
    'report.json'
  ]);
});
