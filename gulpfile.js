'use strict';

var gulp = require('gulp');
var gulpNunjucks = require('gulp-nunjucks-render');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');

// Static Server + watching scss/html files
gulp.task('serve', ['html', 'sass'], function() {

  browserSync.init({
    server: "./build"
  });

  gulp.watch("./source/sass/**/*.scss", ['sass']);
  gulp.watch("./source/html/**/*.html").on('change', browserSync.reload);
});

gulp.task('html', function() {
  return gulp.src('./source/html/*.html')
    .pipe(gulpNunjucks({
      path: ['./source/html'] // String or Array
    }))
    .pipe(gulp.dest('./build'));
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
  return gulp.src("./source/sass/*.scss")
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./build/assets/css'))
    .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);