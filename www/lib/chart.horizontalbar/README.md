#Chart.HorizontalBar.js

Horizontal Bar Chart plugin for Chart.js [chartjs.org](http://www.chartjs.org)

## Introduction
Horizontal bar charts are a much-requested missing chart option from Chart.js, which is otherwise a fantastic library.

This plugin aims to fill that gap and is based on work by @erikdattilo
which you can find here https://github.com/erikdattilo/Chart.js/tree/issue/073-horizontal-bar-chart

The difference with this plugin is that it does not require any changes
to Chart.js itself.

It's hacky, kinda brittle, and repeats a bunch of code already in Chart.js, but until horizontal bar charts are supported natively, this should do okay.

If you want to fork this and clean it up, feel free. I'm sure there's plenty of room for improvement and I'm probably not going to be messing with it too much.

## Usage

Install via bower.

```bash
$ bower install chart.horizontalbar
```

This plugin can be used in exactly the same way as the standard (vertical) Bar charts in Chart.js.

All the same options apply. Tooltips are not working, but it wouldn't take much work to add them in if someone wants to take a crack at it.

### Example usage

```javascript
var horizontalBarChart = new Chart(ctx).HorizontalBar(data, options);
```

See the example in /samples/horizontal-bar.html for more information,
or simply refer to the
[Chart.js Bar Chart docs](http://www.chartjs.org/docs/#bar-chart).

## License

Chart.HorizontalBar.js is available under the [MIT license](http://opensource.org/licenses/MIT). Take it, break it, re-make it. Whatever.
