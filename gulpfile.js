"use strict";
const gulp = require('gulp');
const less = require('gulp-less');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');

const lessPath = path.join(__dirname, './src/style/less');
const stylePath = path.join(__dirname, './src/style');

gulp.task('lesscompile', function() {
    return gulp.src(`${lessPath}/index.less`)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(stylePath));
});

gulp.task('watch', function() {
    let watcher = gulp.watch([`${lessPath}/**/*.less`], ['lesscompile']);
    watcher.on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

gulp.task('default', ['lesscompile', 'watch']);