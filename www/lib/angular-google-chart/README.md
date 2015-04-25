Google Chart Tools Directive Module
============================
for AngularJS
-------------

### Goal

Wrapper directive for [Google Chart Tools](https://google-developers.appspot.com/chart/)

### A note on branches

Developpement branch is `gh-pages`.

Release branch is `master` (idealy), and was created just because Bower needed it.

Please send your pull requests to `gh-pages`.

### Usage and Demo

See sample files index.html and controllers in partials directory. [Live Demo](http://bouil.github.io/angular-google-chart/)

#### Other samples

* http://plnkr.co/edit/3RJ2HS?p=preview
* http://plnkr.co/edit/E4iPtQ?p=preview

### Chart Data doc

See [ChartWrapper](https://google-developers.appspot.com/chart/interactive/docs/reference#chartwrapperobject) and [DataTable](https://google-developers.appspot.com/chart/interactive/docs/reference#DataTable) documentation.

### Release notes

#### 0.0.11

* Revert to AngularJS 1.2.x as requested by user.
* Changed Charts API loader config from a constant to a value to accomodate the use of localization localization features.
* Add before-draw event callback attribute, allowing for last-minute changes from user's javascript (like dynamically resizing chart area for responsive designs).
* Added French local sample.
* Fixed issue where changing view properties didn't cause a redraw.

#### 0.0.10

* Fixed bug with Formatter implementation.
* Fix issue where Select listener function was not called for unselect events.
* Fixed some issues where drawing the chart triggered another call to draw the chart.
* `select` attribute is now deprecated, to be removed in a future release.  Replaced with `on-select` to keep naming consistent with `on-ready`.

#### 0.0.9

* Load Google Charts API with https as default protocol.
* Support for Custom Formatters
* Added and Reorganized Samples
* Improved IE Compatability for API Loading

#### 0.0.8

Exposing a factory `googleChartApiPromise` which is a Promise resolved when the `google` global object is correctly initialized.

#### 0.0.7

Removed jQuery dependency.

#### 0.0.3

Advanced chart formatter are available. Therefore, compatibility is broken withe the previous version of NumberFormat. Check the demo for usage.

#### 0.0.2

The module is now named `googlechart` (instead of `googlechart.directives`)

### Out of luck ?

Try another AngularJS directive that use [Highcharts](https://github.com/pablojim/highcharts-ng).
