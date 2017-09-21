var gulp = require("gulp");
var sass = require("gulp-sass");
var minifyHtml = require("gulp-minify-html");
var ngHtml2js = require("gulp-ng-html2js");
var ngAnnotate = require("gulp-ng-annotate");
var iife = require("gulp-iife");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");

gulp.task("sass", function() {
    return gulp.src("src/picker.scss")
        .pipe(concat("ion-datetime-picker.min.scss"))
        .pipe(sass({outputStyle: "compressed"}))
        .pipe(gulp.dest("release"));
});

gulp.task("html", function() {
    return gulp.src("src/picker-*.html")
        .pipe(minifyHtml({
            empty: true,
            spare: true,
            quotes: true
        }))
        .pipe(ngHtml2js({
            moduleName: "ion-datetime-picker",
            declareModule: false
        }))
        .pipe(concat("ion-datetime-picker.min.js"))
        .pipe(gulp.dest("release"));
});

gulp.task("js", ["html"], function() {
    return gulp.src(["src/picker.js", "src/picker-*.js", "release/ion-datetime-picker.min.js"])
        .pipe(ngAnnotate())
        .pipe(concat("ion-datetime-picker.min.js"))
        .pipe(iife())
        .pipe(uglify())
        .pipe(gulp.dest("release"));
});

gulp.task("build", ["sass", "js"]);

gulp.task("default", ["build"]);
