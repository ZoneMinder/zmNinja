cordovaHTTP
==================

Cordova / Phonegap plugin for communicating with HTTP servers.  Supports iOS and Android.

## Advantages over Javascript requests

 - Background threading - all requests are done in a background thread.
 - SSL Pinning - read more at [LumberBlog](http://blog.lumberlabs.com/2012/04/why-app-developers-should-care-about.html).

## Installation

The plugin conforms to the Cordova plugin specification, it can be installed
using the Cordova / Phonegap command line interface.

    phonegap plugin add https://github.com/wymsee/cordova-HTTP.git

    cordova plugin add https://github.com/wymsee/cordova-HTTP.git

## Usage

### AngularJS

This plugin creates a cordovaHTTP service inside of a cordovaHTTP module.  You must load the module when you create your app's module.

    var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'cordovaHTTP']);
    
You can then inject the cordovaHTTP service into your controllers.  The functions can then be used identically to the examples shown below except that instead of accepting success and failure callback functions, each function returns a promise.  For more information on promises in AngularJS read the [AngularJS docs](http://docs.angularjs.org/api/ng/service/$q).  For more info on promises in general check out this article on [html5rocks](http://www.html5rocks.com/en/tutorials/es6/promises/).  Make sure that you load cordova.js or phonegap.js after AngularJS is loaded.

### Not AngularJS

This plugin registers a `cordovaHTTP` global on window


## Functions

All available functions are documented below.  Every function takes a success and error callback function as the last 2 arguments.

### useBasicAuth
This sets up all future requests to use Basic HTTP authentication with the given username and password.

    cordovaHTTP.useBasicAuth("user", "password", function() {
        console.log('success!');
    }, function() {
        console.log('error :(');
    });
    
### setHeader
Set a header for all future requests.  Takes a header and a value.

    cordovaHTTP.setHeader("Header", "Value", function() {
        console.log('success!');
    }, function() {
        console.log('error :(');
    });

### enableSSLPinning
Enable or disable SSL pinning.  To use SSL pinning you must include at least one .cer SSL certificate in your app project.  You can pin to your server certificate or to one of the issuing CA certificates. For ios include your certificate in the root level of your bundle (just add the .cer file to your project/target at the root level).  For android include your certificate in your project's platforms/android/assets folder.  In both cases all .cer files found will be loaded automatically.  If you only have a .pem certificate see this [stackoverflow answer](http://stackoverflow.com/a/16583429/3182729).  You want to convert it to a DER encoded certificate with a .cer extension.

As an alternative, you can store your .cer files in the www/certificates folder.

    cordovaHTTP.enableSSLPinning(true, function() {
        console.log('success!');
    }, function() {
        console.log('error :(');
    });
    
### acceptAllCerts
Accept all SSL certificates.  Or disable accepting all certificates.

    cordovaHTTP.acceptAllCerts(true, function() {
        console.log('success!');
    }, function() {
        console.log('error :(');
    });
    
### post<a name="post"></a>
Execute a POST request.  Takes a URL, parameters, and headers.

#### success
The success function receives a response object with 2 properties: status and data.  Status is the HTTP response code and data is the response from the server as a string. Here's a quick example:

    {
        status: 200,
        data: "{'id': 12, 'message': 'test'}"
    }
    
Most apis will return JSON meaning you'll want to parse the data like in the example below:

    cordovaHTTP.post("https://google.com/, {
        id: 12,
        message: "test"
    }, { Authorization: "OAuth2: token" }, function(response) {
        // prints 200
        console.log(response.status);
        try {
            response.data = JSON.parse(response.data);
            // prints test
            console.log(response.data.message);
        } catch(e) {
            console.error("JSON parsing error");
        }
    }, function(response) {
        // prints 403
        console.log(response.status);
        
        //prints Permission denied 
        console.log(response.error);
    });
    
    
#### failure
The error function receives a response object with 2 properties: status and error.  Status is the HTTP response code.  Error is the error response from the server as a string.  Here's a quick example:

    {
        status: 403,
        error: "Permission denied"
    }
    
### get
Execute a GET request.  Takes a URL, parameters, and headers.  See the [post](#post) documentation for details on what is returned on success and failure.

    cordovaHTTP.get("https://google.com/, {
        id: 12,
        message: "test"
    }, { Authorization: "OAuth2: token" }, function(response) {
        console.log(response.status);
    }, function(response) {
        console.error(response.error);
    });
    
### uploadFile
Uploads a file saved on the device.  Takes a URL, parameters, headers, filePath, and the name of the parameter to pass the file along as.  See the [post](#post) documentation for details on what is returned on success and failure.

    cordovaHTTP.uploadFile("https://google.com/, {
        id: 12,
        message: "test"
    }, { Authorization: "OAuth2: token" }, "file:///somepicture.jpg", "picture", function(response) {
        console.log(response.status);
    }, function(response) {
        console.error(response.error);
    });
    
### downloadFile
Downloads a file and saves it to the device.  Takes a URL, parameters, headers, and a filePath.  See [post](#post) documentation for details on what is returned on failure.  On success this function returns a cordova [FileEntry object](http://cordova.apache.org/docs/en/3.3.0/cordova_file_file.md.html#FileEntry).

    cordovaHTTP.downloadFile("https://google.com/, {
        id: 12,
        message: "test"
    }, { Authorization: "OAuth2: token" }, "file:///somepicture.jpg", function(entry) {
        // prints the filename
        console.log(entry.name);
        
        // prints the filePath
        console.log(entry.fullPath);
    }, function(response) {
        console.error(response.error);
    });


## Libraries

This plugin utilizes some awesome open source networking libraries.  These are both MIT licensed:

 - iOS - [AFNetworking](https://github.com/AFNetworking/AFNetworking)
 - Android - [http-request](https://github.com/kevinsawicki/http-request)

We made a few modifications to http-request.  They can be found in a separate repo here: https://github.com/wymsee/http-request

## Limitations

This plugin isn't equivalent to using XMLHttpRequest or Ajax calls in Javascript.
For instance, the following features are currently not supported:

- cookies support (a cookie set by a request isn't sent in subsequent requests)
- read content of error responses (only the HTTP status code and message are returned)
- read returned HTTP headers (e.g. in case security tokens are returned as headers)

Take this into account when using this plugin into your application.

## License

The MIT License

Copyright (c) 2014 Wymsee, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
