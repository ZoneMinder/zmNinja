ng-websocket
============

**AngularJS HTML5 WebSocket** powerful wrapper module to develop with ease and fun!

# Index

  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Tutorial](#tutorial)
  - [Features](#features)
    - [Lazy Initialization](#lazy)
    - [Auto Reconnection](#reconnect)
    - [Enqueue Unsent Messages](#enqueue)
    - [Mock Websocket Server](#mock)
  - [Testing](#testing)
  - [API](#api)
    - [$websocketProvider](#websocketProvider)
      - [$setup](#setup)
    - [$websocket](#websocket)
      - [$new](#new)
      - [$get](#get)
    - [ngWebsocket](#ngWebsocket)
      - [Constructor](#constructor)
      - [Constants](#constants)
      - [Events](#events)
      - [$on](#on)
      - [$un](#un)
      - [$emit](#emit)
      - [$open](#open)
      - [$close](#close)
      - [$status](#status)
      - [$ready](#ready)
      - [$mockup](#mockup)
    - [$$mockWebsocket](#mockWebsocket)
  - [Contribute](#contribute)
  - [License](#license)

# Introduction

**ngWebsocket** is a library that provides a provider and a service to handle **HTML5 WebSocket** with ease
in pure **AngularJS** style!
The idea behind this module is to give four kinds of object to handle websockets:

  - **$websocketProvider**: the provider is on top of usage. In fact, you can setup a general configuration for each ngWebsocket you're going to create
  - **$websocket**: following an Angular service that lets you to handle different websocket instance among your application
  - **ngWebsocket**: an instance of the HTML5 WebSocket wrapper (this is actually the core of this module): it provides lots of feature to work with websockets
  - **$$mockWebsocket**: this is a smart implementation of a websocket backend that lets you to developer and test your app without a real responding server

For each of these objects an API is available and fully documented in this document.

# Requirements

The only requirement needed is [AngularJS](https://angularjs.org/) that you can install it via [Bower](http://bower.io/).

# Installation

Use [Bower](http://bower.io/) to install this module:

```bash
$ bower install ng-websocket
```

Or simply `git clone` the repo and install the dependencies with [NPM](https://www.npmjs.org/):

```bash
$ git clone https://github.com/wilk/ngWebsocket
$ cd ngWebsocket
$ npm install
```

# Usage

After the [Installation](#installation), require it in your Angular application.

Firstly, in your `index.html`:

```html
<html>
    <head>
        <script src="bower_components/ng-websocket/ng-websocket.js"></script>
    </head>
</html>
```

Then, in your Angular application definition (assumed `app.js`):

```javascript
    'use strict';

    angular.module('MyApp', ['ngWebsocket']);
```

Now, you're ready to use it!

# Tutorial

Need to use HTML5 WebSocket to build your cool web application, huh?
No problem, dude! Check this out!

```javascript
'use strict';

angular.module('MyCoolWebApp', ['ngWebsocket'])
    .run(function ($websocket) {
        var ws = $websocket.$new('ws://localhost:12345'); // instance of ngWebsocket, handled by $websocket service

        ws.$on('$open', function () {
            console.log('Oh my gosh, websocket is really open! Fukken awesome!');

            ws.$emit('ping', 'hi listening websocket server'); // send a message to the websocket server

            var data = {
                level: 1,
                text: 'ngWebsocket rocks!',
                array: ['one', 'two', 'three'],
                nested: {
                    level: 2,
                    deeper: [{
                        hell: 'yeah'
                    }, {
                        so: 'good'
                    }]
                }
            };

            ws.$emit('pong', data);
        });

        ws.$on('pong', function (data) {
            console.log('The websocket server has sent the following data:');
            console.log(data);

            ws.$close();
        });

        ws.$on('$close', function () {
            console.log('Noooooooooou, I want to have more fun with ngWebsocket, damn it!');
        });
    });
```

Easy, right?

Well, let's chain it!

```javascript
'use strict';

angular.module('MyCoolChainedWebApp', ['ngWebsocket'])
    .run(function ($websocket) {
        var ws = $websocket.$new('ws://localhost:12345')
          .$on('$open', function () {
            console.log('Oh my gosh, websocket is really open! Fukken awesome!');

            var data = {
                level: 1,
                text: 'ngWebsocket rocks!',
                array: ['one', 'two', 'three'],
                nested: {
                    level: 2,
                    deeper: [{
                        hell: 'yeah'
                    }, {
                        so: 'good'
                    }]
                }
            };

            ws.$emit('ping', 'hi listening websocket server') // send a message to the websocket server
              .$emit('pong', data);
          })
          .$on('pong', function (data) {
            console.log('The websocket server has sent the following data:');
            console.log(data);

            ws.$close();
          })
          .$on('$close', function () {
            console.log('Noooooooooou, I want to have more fun with ngWebsocket, damn it!');
          });
    });
```

Your back-end team is lazy? No problem: we can do it on our own!

```javascript
'use strict';

angular.module('MyIndipendentCoolWebApp', ['ngWebsocket'])
    .run(function ($websocket) {
        var ws = $websocket.$new({
            url: 'ws://localhost:12345',
            mock: {
                fixtures: {
                    'custom event': {
                        data: 'websocket server mocked response'
                    },
                    'another event': {
                        data: {
                            damn: 'dude',
                            that: 'is awesome!'
                        }
                    }
                }
            }
        });

        ws.$on('$open', function () {
            ws.$emit('an event', 'a parrot response') // by default it responde with the same incoming data
              .$emit('custom event') // otherwise it uses the given fixtures
              .$emit('another event'); // even for objects
          })
          .$on('an event', function (message) {
            console.log(message); // it prints 'a parrot response'
          })
          .$on('custom event', function (message) {
            console.log(message); // it prints 'websocket server mocked response'
          })
          .$on('another event', function (message) {
            console.log(message); // it prints the object {damn: 'dude', that: 'is awesome!'}
          });
    });
```

# Features

ngWebsocket comes from Italy with lots of interesting stuff, folks!
Why not just a wrapper? Because we can do more with happiness and fun!

So, let's discover the awesome features list!

## Lazy

Using basic HTML5 WebSocket object, you experienced that the connection is open immediately, just after the websocket is created with **new** constructor.
By default, the same behaviour is used by ngWebsocket but you can simply change it with this powerful feature:

```javascript
angular.run(function ($websocket, $timeout) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        lazy: true
    });

    ws.$on('$open', function () {
        console.log('The ngWebsocket has open!'); // It will print after 5 (or more) seconds
    });

    $timeout(function () {
        ws.$open(); // Open the connction only at this point. It will fire the '$open' event
    }, 5000);
});
```

With [$websocket.$open](#open) function, you can open the connection when you want, especially after the coffee break.

**Default: disabled**

## Reconnect

Ok, your websocket connection went down due to a bad wifi connection and you don't want to make another connection
manually, right?
So, what about an automated feature that do this for you?

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        reconnect: true // it will reconnect after 2 seconds
    });

    ws.$on('$open', function () {
        console.log('Here we are and I\'m pretty sure to get back here for another time at least!');
      })
      .$on('$close', function () {
        console.log('Got close, damn you silly wifi!');
      });
});
```

With this feature, if the connection goes down, it will open again after 2 seconds by default.
If you need to get the connection back in fewer time, just use the **reconnectInterval** time slice:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        reconnect: true,
        reconnectInterval: 500 // it will reconnect after 0.5 seconds
    });

    ws.$on('$open', function () {
        console.log('Here we are and I\'m pretty sure to get back here for another time at least!');
      })
      .$on('$close', function () {
        console.log('Got close, damn you silly wifi!');
      });
});
```

**Pay attention, good sir**: if you close the ngWebsocket with the [**$close**](#close) method, it won't get the connection back
until the [**$open**](#open) is invoked!

**Default: enabled**

## Enqueue

From great powers come great responsability. Keep this in mind while reading this feature.

Sometimes, it would be useful if someone save our websocket communication, especially when the connection is down.
With this powerful feature, it's possible to store every unsent message in a queue and then flush them just the connection get up again.

How? Enabling enqueue feature, of course!

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        lazy: true,
        enqueue: true
    });

    ws.$emit('dude event', 'hi dude!'); // this message couldn't be forwarded because of the lazy property (the websocket is still closed)

    ws.$on('$open', function () {
        console.log('I\'m sure the above message gets sent before this log is printed in the console ;)');
    });

    ws.$open(); // when the websocket gets open, flushes every message stored in the internal queue
});
```

**BUT** this means that each message is stored into a memory queue and it can get really big, especially if your application sends many messages in a short time slice.

**Default: disabled**

## Mock

Dulcis in fundo, a websocket server implementation to use and test your application, without a real websocket server listening!
Yep, you well heard!

Think about this situation: you're developing the front-end part of your company application and the backend team is lazy (because every developer is lazy),
so you couldn't start writing your section because you need to send/retrieve data to/from the server.

No problem, you can!

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        mock: true
    });

    ws.$on('$open', function () {
        ws.$emit('hi', 'dude');
      })
      .$on('hi', function (message) {
        console.log(message); // it prints 'dude'
      });
});
```

By default, the mock feature simulate a parrot websocket server: this means that every message sent with
a certain event, will have a response with the same structure, with the same event and the same data.

However, you can setup some fixtures that simulate what your lazy back-end team is going to do after beer time:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        mock: {
            fixtures: {
                hi: {
                    data: 'dude, this is a custom message!'
                }
            }
        }
    });

    ws.$on('$open', function () {
        ws.$emit('hi');
      })
      .$on('hi', function (message) {
        console.log(message); // it prints 'dude, this is a custom message'
      });
});
```

**Default: disabled**

# Testing

This module uses [Karma](http://karma-runner.github.io/0.12/index.html) with [Jasmine](http://jasmine.github.io/) for unit testing, so before launching any test check out if all dependencies are correctly installed:

```bash
$ npm install
```

After that, launch the test:

```bash
$ npm test
```

# API

ngWebsocket APIs are composed by four different modules:

 - **$websocketProvider**
 - **$websocket**
 - **ngWebsocket**
 - **$$mockWebsocket** (private but configurable)

## $websocketProvider

Following the API of ngWebsocket Provider

### $setup

If you need to setup your custom default configuration for each ngWebsocket istance, pass it to this method:

```javascript
angular.config(function ($websocketProvider) {
    $websocketProvider.$setup({
        lazy: false,
        reconnect: true,
        reconnectInterval: 2000,
        mock: false,
        enqueue: false
    });
});
```

**Usage**

```javascript
$setup(config)
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| config    | Object   | default ngWebsocket configuration |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| $websocketProvider | the $websocketProvider |

## $websocket

Following the API of the $websocket Service

### $get

Every ngWebsocket instance created with [$websocket.$new](#new) method are stored within the $websocket service.
To get one of them, you can use **$get** with the url of the websocket you're looking for:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$get('ws://localhost:12345');
});
```

The url is needed because it is stored using the url as the key of an hashmap.

**Usage**

```javascript
$get(url)
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| url       | String   | the websocket url |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | an instance of ngWebsocket or undefined |

### $new

There are two ways to create a new instance of ngWebsocket:

**string (url)**

The url is always needed and it has to start with the websocket schema (ws:// or wss://):

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new('ws://localhost:12345');
});
```

A new instance is returned and the internal WebSocket has already started the connection with the websocket server on the backend.

**object**

All of the following configurations can be changed:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new(
        url: 'ws://localhost:12345',
        lazy: false,
        reconnect: true,
        reconnectInterval: 2000,
        mock: false,
        enqueue: false
    );
});
```

For more information see the [ngWebsocket Constructor section](#constructor).

**Usage**

```javascript
$new(url|config)
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| url/config | String/Object | websocket url or a configuration set |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | an instance of ngWebsocket |

## ngWebsocket

ngWebsocket is the core of this module.
In a few words, it's a wrapper for the HTML5 WebSocket object, extending it with different features.
It acts like an EventEmitter and it provides a common way to attach a handler for each fired event.

Following the API in detail.

### Constructor

The constructor of the ngWebsocket accepts two kind of parameters:

  - String: the url starting with the WebSocket schema (ws:// or wss://)
  plus an optional String/String[] containing the protocols (this matches
  the WebSocket constructor API)
  - Object: a configuration containing the websocket url

The url is a requirement to create a new ngWebsocket.
An instance is always created with a factory method by the [$websocket](#websocket) service: in fact,
it lets to make different websockets that are pointing to different urls.

Example of a basic instantiation:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new('ws://localhost:12345', ['binary', 'base64']);
});
```

Using Object configuration:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        lazy: false,
        reconnect: true,
        reconnectInterval: 2000,
        enqueue: false,
        mock: false,
        protocols: ['binary', 'base64']
    });
});
```

Following the explanation of the configuration object - {Type} PropertyName (default):

  - **{Boolean} lazy (false)**: lazy initialization. A websocket can open the connection when ngWebsocket is instantiated with [$websocket.$new](#new) (false) or afterwards with [$open](#open) (false). For more information see [Features - Lazy Initialization](#lazy)
  - **{Boolean} reconnect (true)**: auto reconnect behaviour. A websocket can try to reopen the connection when is down (true) or stay closed (false). For more information see [Features - Auto Reconnect](#reconnect)
  - **{Number} reconnectInterval (2000)**: auto reconnect interval. By default, a websocket try to reconnect after 2000 ms (2 seconds). For more information see [Features - Auto Reconnect](#reconnect)
  - **{Boolean} enqueue (false)**: enqueue unsent messages. By default, a websocket discards messages when the connection is closed (false) but it can enqueue them and send afterwards the connection gets open back (true). For more information see [Features - Enqueue Unsent Messages](#enqueue)
  - **{Boolean/Object} mock (false)**: mock a websocket server. By default, a websocket run only if the webserver socket is listening (false) but it can be useful to mock the backend to make the websocket working (true). For more information see [Features - Mock Websocket Server](#mock)
  - **{String/String[]} (null)**: Either a single protocol string or an array of protocol strings. This is the same as the WebSocket protocols argument.

### Constants

Websocket status constants:

  - **$CONNECTING**: the websocket is trying to open the connection
  - **$OPEN**: the websocket connection is open
  - **$CLOSING**: the websocket connection is closing
  - **$CLOSED**: the websocket connection is closed

### Events

There are custom events fired by ngWebsocket.
They are useful to setup a listener for certain situations and behaviours:

  - **$open**: the websocket gets open
  - **$close**: the websocket gets closed
  - **$error**: an error occurred (callback params: {Error} error)
  - **$message**: the original message sent from the server (callback params: {String} message). Usually, it's a JSON encoded string containing the event to fire and the data to pass ({"event": "an event", "data": "some data"})

The other events are custom events, setup by the user itself.

### $on

Attach one or more handlers to a specific event.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new('ws://localhost:12345');

    // Single event handler
    ws.$on('my event', function myHandler () {...});

    // Different event handlers
    ws.$on('another event', myHandler, mySecondHandler, myThirdHandler);

    // Different chained event handlers
    ws.$on('third event', function myHandler () {...})
      .$on('third event', function mySecondHandler () {...})
      .$on('third event', function myThirdHandler () {...});
});
```

Now the websocket is listening for 'my event' event and the handler 'myHandler' will be called when that event
is sent by the websocket server. The same thing happens for the other two cases: each event handler is called
one by one, starting from the first one, ending with the last one.

**Usage**

```javascript
$on(event, handler|handlers)
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| event | String | the event to attach a listener |
| handler/handlers | Function/Function[] | one or more handlers to invoke when the event is fired up |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | the ngWebsocket |

### $un

Detach a handler from a specific event.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new('ws://localhost:12345');

    ws.$on('my event', function myHandler () {...});
    ws.$un('my event');
});
```

The above websocket has not listener attached at the end of the execution.


**Usage**

```javascript
$un(event)
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| event     | String   | the event to detach the listener |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | the ngWebsocket |

### $emit

Send an event to the websocket server.

It's possible to send a lonely event or attaching some data to it.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new('ws://localhost:12345');

    ws.$on('$open', function () {
        ws.$emit('lonely event'); // the websocket server will receive only the event name
        ws.$emit('event with data', 'some data'); // it will send the event with 'some data' string
        ws.$emit('with object', {some: 'data'}); // it will send the event with the object JSONified
    });
});
```

It's possible to send both simply (like strings and numbers) and complex data (like objects and arrays).

**Usage**

```javascript
$emit(event, [data])
```

**Arguments**

| **Param** | **Type** | **Details** |
| --------- | -------- | ----------- |
| event     | String   | the event to send |
| data (optional) | String/Number/Object | the data to send with the event |

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | the ngWebsocket |

### $open

Open the websocket connection if it's closed.

```javascript
angular.run(function ($websocket, $timeout) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        lazy: true
    });

    ws.$on('$open', function () {
        console.log('The websocket now is open');
    });

    $timeout(function () {
        ws.$open(); // it will open the websocket after 5 seconds
    }, 5000);
```

**Usage**

```javascript
$open()
```

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | the ngWebsocket |

### $close

It closes the websocket connection if it's open.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new(url: 'ws://localhost:12345');

    ws.$on('$open', function () {
        ws.$close(); // it closes the websocket connection
    });

    ws.$on('$close', function () {
        console.log('Connection closed!');
    });
```

**Usage**

```javascript
$close()
```

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| ngWebsocket | the ngWebsocket |

### $status

It returns the current status of the websocket connection.
It's possible to use the [websocket constants](#constants) to make checks.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new(url: 'ws://localhost:12345');

    console.log(ws.$status()); // it prints ws.$CONNECTING

    ws.$on('$open', function () {
        console.log(ws.$status()); // it prints ws.$OPEN
        ws.$close(); // it closes the websocket connection
        console.log(ws.$status()); // it prints ws.$CLOSING
    });

    ws.$on('$close', function () {
        console.log(ws.$status()); // it prints ws.$CLOSED
        console.log('Connection closed!');
    });
```

**Usage**

```javascript
$status()
```

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| Number   | a constant number representing the websocket connection readyState |

### $ready

It returns if the websocket connection is open or closed.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new(url: 'ws://localhost:12345');

    console.log(ws.$ready()); // it prints false

    ws.$on('$open', function () {
        console.log(ws.$ready()); // it prints true
        ws.$close(); // it closes the websocket connection
        console.log(ws.$ready()); // it prints false
    });

    ws.$on('$close', function () {
        console.log(ws.$ready()); // it prints false
        console.log('Connection closed!');
    });
```

**Usage**

```javascript
$ready()
```

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| Boolean  | true if the connection is OPEN, false otherwise |

### $mockup

It returns if the websocket is mocked up or not.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new(url: 'ws://localhost:12345');

    console.log(ws.$mockup()); // it prints false

    var ws2 = $websocket.$new({
        url: 'ws://localhost:54321',
        mock: true
    });

    console.log(ws.$mockup()); // it prints true
```

**Usage**

```javascript
$mockup()
```

**Returns**

| **Type** | **Details** |
| -------- | ----------- |
| Boolean  | true if the ngWebsocket istance is mocked up, false otherwise |

## $$mockWebsocket

If you need to develop or test your application without a real websocket backend server, you can setup
a mockup of it with this feature.
The only thing to do is to pass a configuration object during the ngWebsocket initialization:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        mock: {
            openTimeout: 500,
            closeTimeout: 1000,
            messageInterval: 2000,
            fixtures: {}
        }
    });
```

Following the explanation of the configuration object - {Type} PropertyName (default)::

  - **{Boolean/Object} mock (false)**: could be either a Boolean (default to false) or an object
  - **{Number} openTimeout (500)**: timeout to make the internal websocket to get open
  - **{Number} closeTimeout (1000)**: timeout to make the internal websocket to get closed
  - **{Number} messageInterval (2000)**: the internal websocket sends enqueued message with this interval time
  - **{Object/String} fixtures ({})**: an object of fixtures, where the keys are the events and the values are the data to respond, or an url to retrieve remote fixtures via HTTP

Fixtures can mock both custom events and data.
They can be added as a static object with the following structure:

```javascript
fixtures: {
    'incoming event name': {
        event: 'outgoing event name',
        data: 'response data'
    }
}
```

The *incoming event name* is the event fired by the websocket while the *outgoing event name* is the one sent by the mocked webserver.
So, it be useful to map events with a custom response.
By default, the mock feature acts like a parrot server, responding with the same data on the same received event.

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
        url: 'ws://localhost:12345',
        mock: {
            fixtures: {
                'mock data': {
                    data: {
                        hello: 'world'
                    }
                },
                'mock data and event': {
                    event: 'custom event',
                    data: {
                        hello: 'mocked world'
                    }
                }
            }
        }
    });

    ws.$on('$open', function () {
        ws.$emit('parrot event', 'parrot data')
          .$emit('mock data')
          .$emit('mock data and event');
      })
      .$on('parrot event', function (message) {
        console.log(message); // it prints 'parrot data'
      })
      .$on('mock data', function (message) {
        console.log(message); // it prints '{hello: 'world'}'
      })
      .$on('custom event', function (message) {
        console.log(message); // it prints '{hello: 'mocked world'}'
      });
```

Fixtures can be loaded through an HTTP request.
In fact, it be useful to have those in a JSON file or created by the webserver:

```javascript
angular.run(function ($websocket) {
    var ws = $websocket.$new({
            url: 'ws://localhost:12345',
            mock: {
                fixtures: '/fixtures.json' // fixtures are located in a file or calculated at run-time by the web server
            }
        });
    
    // Now you're ready to use fixtures because the websocket will be available only when the fixtures are loaded
});
```

# Contribute

Wanna contribute, fella?
That's the right place to find useful information!

How?

  - improve and fix the documentation
  - test it
  - make some demos
  - use it
  - write new pieces of code
  - optimize it
  - find bugs

And don't forget to make **pull requests**, damn it!

# License

Check out LICENSE file (MIT)