Angular Tooltips
==================

[![Join the chat at https://gitter.im/720kb/angular-tooltips](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/720kb/angular-tooltips?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Angular Tooltips is an angularjs directive that generates a tooltip on your element.


The angular tooltips is developed by [720kb](http://720kb.net).

##Requirements


AngularJS v1.2+

##Screen
![Angular tooltips](http://i.imgur.com/2rOwAbQ.png)

###Browser support


Chrome  ![ok](http://i.imgur.com/CK8qxk1.png)

Firefox ![ok](http://i.imgur.com/CK8qxk1.png)

Safari ![ok](http://i.imgur.com/CK8qxk1.png)

Opera ![ok](http://i.imgur.com/CK8qxk1.png)

IE    ![mmm](http://i.imgur.com/iAIwqCL.png)


## Load

To use the directive, include the angular tooltips's javascript and css files in your web page:

```html
<!DOCTYPE HTML>
<html>
<head>
  <link href="src/css/angular-tooltips.css" rel="stylesheet" type="text/css" />
</head>
<body ng-app="app">
  //.....
  <script src="src/js/angular-tooltips.js"></script>
</body>
</html>
```

##Install

###Bower installation

```
$ bower install angular-tooltips --save
```

_then load the js files in your html_

###Add module dependency

Add the 720kb.tooltips module dependency

```js
angular.module('app', [
  '720kb.tooltips'
 ]);
```


Call the directive wherever you want in your html page

```html

<a href="#" tooltips title="tooltip">Tooltip me</a>

```
##Options
Angular tooltips allows you to use some options via `attribute` data

####Tooltip position
You can set your tooltip to show on `left` or `right` or `top` or `bottom` position
using the `tooltip-side=""` attribute
```html
<a href="#" tooltips tooltip-title="tip" tooltip-side="top">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-side="bottom">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-side="left">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-side="right">Tooltip me</a>
```

####Tooltip title
You can set your tooltip title (text/html doesn't matter)
using the `tooltip-title=""` attribute or simply via `title=""` html attribute

```html
<a href="#" tooltips tooltip-title="tip" tooltip-title="Hey" tooltip-content="<i>Woa!</i>">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" title="Hey" tooltip-content="<i>Woa!</i>">Tooltip me</a>
```

####Tooltip content
You can set your tooltip content
using the `tooltip-content=""` attribute

```html
<a href="#" tooltips tooltip-title="tip" tooltip-content="Woa!">Tooltip me</a>
```

####Tooltip HTML content
You can set your tooltip html content
using the `tooltip-html=""` attribute

```html
<a href="#" tooltips tooltip-title="tip" tooltip-html="<i>Woa!</i>">Tooltip me</a>
```

####Tooltip size
You can set your tooltip size (small || medium || large)
using the `tooltip-size=""` attribute

```html
<a href="#" tooltips tooltip-title="tip"  tooltip-size="small">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-size="medium">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-size="large">Tooltip me</a>
```
####Tooltip speed
You can set the tooltip transition speed ('fast' || 'medium' || 'slow' || int(milliseconds))
using the `tooltip-speed=""` attribute

```html
<a href="#" tooltips tooltip-speed="fast" tooltip-title="tip">Tooltip fast</a>
<a href="#" tooltips tooltip-speed="medium" tooltip-title="tip">Tooltip medium</a>
<a href="#" tooltips tooltip-speed="slow" tooltip-title="tip">Tooltip slow</a>
<a href="#" tooltips tooltip-speed="950" tooltip-title="tip">Tooltip custom</a>
```
####Tooltip delay
You can set the tooltip transition delay (ms)
using the `tooltip-delay=""` attribute

```html
<a href="#" tooltips tooltip-delay="800" tooltip-title="tip">Tooltip in 800ms</a>
```
####Tooltip try
If space is not available for tooltip , it will automatically search for a similar alternative position to show. You can set tooltip try (1 || 0) 
using the `tooltip-try=""` attribute

```html
<a href="#" tooltips tooltip-title="tip" tooltip-try="1">Tooltip me</a>
<a href="#" tooltips tooltip-title="tip" tooltip-try="0">Tooltip me</a>
```
####Tooltip lazy
If you don't want to re-init the tooltip position everytime the tooltip trigger events are fired, you can set tooltip lazy mode (true || false) 
using the `tooltip-lazy=""` attribute

```html
<a href="#" tooltips tooltip-lazy="false" tooltip-content="Hi" tooltip-show-trigger="mouseover">
I will re-init my position everytime the mouseover event is fired
</a>
<a href="#" tooltips tooltip-lazy="true" tooltip-content="Hi" tooltip-show-trigger="mouseover">
I will init my position on mouseover only the first time event is fired
</a>
```

####Tooltip triggers
You can set your tooltip to show/hide on specific event/events, you can use the `tooltip-show-trigger=""` and the `tooltip-hide-trigger=""` attribute for this scope
```html
<a href="#" tooltips tooltip-title="tip" tooltip-show-trigger="click" tooltip-side="top">Show tooltip only on click</a>
<a href="#" tooltips tooltip-title="tip" tooltip-hide-trigger="click" tooltip-side="bottom">Hide tooltip only on click</a>
<a href="#" tooltips tooltip-title="tip" tooltip-show-trigger="mouseover click" tooltip-hide-trigger="click" tooltip-side="left">Show tooltip on click and mouseover and hide tooltip only on click</a>
```

_**Close button**_

If you want to hide on click, you can configure a close button using text or HTML. This allows your users to click the button inside the tooltip instead of clicking on the original trigger.
```html
<a href="#" tooltips tooltip-title="tip" tooltip-show-trigger="mouseover click" tooltip-hide-trigger="click" tooltip-close-button="x" tooltip-side="left">Show tooltip on click and mouseover and hide tooltip only on click, with option to click on the X</a>
<a href="#" tooltips tooltip-title="tip" tooltip-show-trigger="mouseover click" tooltip-hide-trigger="click" tooltip-close-button='<button type="button">Close Me!</button>' tooltip-side="left">Show tooltip on click and mouseover and hide tooltip only on click, with option to click on HTML button</a>
```

####Tooltip CSS class
You can set a custom CSS class or a set of, using the  `tooltip-class=""` attribute:
```html
<a href="#" tooltips tooltip-class="tooltip-custom tooltip-for-me" tooltip-title="tip" tooltip-side="top">
I will show a tooltip with class="tooltip-custom tooltip-for-me"
</a>
```

## Example

###[Live demo](https://720kb.github.io/angular-tooltips)

##Theming
You can edit the default Css file `angular-tooltips.css` if you want to make a new theme for the tooltips.

##Contributing

We will be much grateful if you help us making this project to grow up.
Feel free to contribute by forking, opening issues, pull requests etc.

## License

The MIT License (MIT)

Copyright (c) 2014 Filippo Oretti, Dario Andrei

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
