# ion-datetime-picker
![GitHub version](https://img.shields.io/github/release/katemihalikova/ion-datetime-picker.svg?style=flat-square)
![Bower version](https://img.shields.io/bower/v/ion-datetime-picker.svg?style=flat-square)
![Ionic version](https://img.shields.io/badge/ionic-%3E%3D1.0.0--beta.9-yellow.svg?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/katemihalikova/ion-datetime-picker.svg?style=flat-square)
![License](https://img.shields.io/github/license/katemihalikova/ion-datetime-picker.svg?style=flat-square)

> Date and/or time picker for awesome [Ionic framework](http://ionicframework.com/)

# Introduction

I made this component because of poor implementation of native datetime picker in Android webview. How funny it was when I discovered that I can only pick a time between 0:00 and 11:59 on my 24-hour clock phone :)

# Features

The ion-datetime-picker component has these features:
- Make Date picker, Time picker, Datetime picker
- Choose Sunday or Monday as the first day of the week
- Use 12-hour or 24-hour clock
- Pick time with or without seconds
- Configure popup title and button labels
- Configure i18n to get weekdays and months in your language

# Demo

Demo app is available - enter code `8d75a0ec` into [Ionic View](http://view.ionic.io/).
Live demo is available on [Codepen](http://codepen.io/katemihalikova/full/dYvjzP/).

#Screenshots

<img src="/../screenshots/date.png?raw=true" alt="Date picker" width="239">
<img src="/../screenshots/time.png?raw=true" alt="Time picker" width="239">
<img src="/../screenshots/datetime.png?raw=true" alt="Datetime picker" width="239">

# Installation

1. Use bower to install the new module:
```bash
bower install ion-datetime-picker --save
```
2. Import the `ion-datetime-picker` javascript and css file into your HTML file (or use [wiredep](https://github.com/taptapship/wiredep)):
```html
<script src="lib/ion-datetime-picker/release/ion-datetime-picker.min.js"></script>
<link href="lib/ion-datetime-picker/release/ion-datetime-picker.min.css" rel="stylesheet">
```
3. Add `ion-datetime-picker` as a dependency on your Ionic app:
```javascript
angular.module("myApp", ["ionic", "ion-datetime-picker"]);
```

# Usage

Put the `ion-datetime-picker` directive alongside the `ng-model` wherever you want to tap to show the picker:
```html
<ion-list>
    <ion-item ion-datetime-picker ng-model="datetimeValue">
        {{datetimeValue| date: "yyyy-mm-dd H:mm:ss"}}
    </ion-item>
</ion-list>
```

## Configuration attributes

### `date` and `time` attributes

Choose which picker type is used. When neither is set, I assume both and use the datetime picker.

### `monday-first` attribute

Set this if you want to have Monday as the first day of a week.

### `seconds` attribute

By default, in the time picker, I allow to change only hours and minutes. Set this attribute to use also seconds.

### `am-pm` attribute

By default, in the time picker, I use 24-hour clock. Set this attribute to change it to 12-hour clock.

### `title` and `sub-title` attributes

Configure the title and sub title of the popup with the picker.

_HINT: Use `data-title` instead of `title` if you are going to use the app in the desktop browser to prevent leaking of the text into a mouseover tooltip._

### `button-ok` and `button-cancel` attributes

Configure the text of buttons at the bottom of the picker.

## Internationalization factory

Simple internationalization option. Inject the `$ionicPickerI18n` factory into your code and set the localized strings.

### `weekdays` key

Array of weekdays abbreviations. `0` is Sunday. If `moment` is installed, I try to get localized data from it, otherwise English ones are used as default.

### `months` key

Array of months names. `0` is January. If `moment` is installed, I try to get localized data from it, otherwise English ones are used as default.

### `ok` and `cancel` keys

Default, global labels of the buttons at the bottom of the picker.

```js
angular.module("myApp")
    .run(function($ionicPickerI18n) {
        $ionicPickerI18n.weekdays = ["Нд", "Lu", "Út", "Mi", "To", "금", "Sá"];
        $ionicPickerI18n.months = ["Janvier", "Febrero", "März", "四月", "Maio", "Kesäkuu", "Červenec", "अगस्त", "Вересень", "Październik", "Νοέμβριος", "డిసెంబర్"];
        $ionicPickerI18n.ok = "オーケー";
        $ionicPickerI18n.cancel = "Cancelar";
    });
```

## Daylight saving time

The datetime picker is using `Date` object with your browser's timezone, including any DST. When you change the date, hour, minute, or second, which sets the time to an invalid value because of moving from 2:00 to 3:00 at the beginning of DST, the time is automatically adjusted to a valid value. On the other hand, when the DST ends, I do NOT take the inserted hour into consideration, but this may be fixed in the future.
