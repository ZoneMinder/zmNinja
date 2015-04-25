// core app start stuff
angular.module('zmApp', [
                            'ionic',
                            'zmApp.controllers',

                        ])

.run(function ($ionicPlatform, $ionicPopup, $rootScope, $state, ZMDataModel) {

    ZMDataModel.init();
    var loginData = ZMDataModel.getLogin();

    if (loginData.username && loginData.password && loginData.url && loginData.apiurl) {
        console.log("VALID CREDENTIALS. Grabbing Monitors");
        ZMDataModel.getMonitors(0);

    }

    // This routine is called whenever the orientation changes
    // so I can recompute my width and height. I use them
    // for scoping graphs as well as figuring out how many thumbnails
    // to show for montages
    window.onorientationchange = function () {
        console.log("**ORIENTATION CHANGE**");
        var pixelRatio = window.devicePixelRatio || 1;
        $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
        $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
        console.log("********Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);
    }

    // This is a skeleton for now. Eventually I am going to prohibit
    // certain views to load unless you've logged in
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        //   console.log ("***** STATE CHANGE CHECK ****");
        var requireLogin = toState.data.requireLogin;
        // console.log ("STATE REQUIRE LOGIN: "+requireLogin);
        if (requireLogin) {
            event.preventDefault();
            //$state.go('app');
            //$ionicPopup.alert ({title: "Error", template:"You are not logged in."});
            //alert ("Not logged in");
            // get me a login modal!
        }
    });


    $ionicPlatform.ready(function () {
        var pixelRatio = window.devicePixelRatio || 1;
        $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
        $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);

        console.log("********Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);

        // What I noticed is when I moved the app to the device
        // the montage screens were not redrawn after resuming from background mode
        // Everything was fine if I switched back to the montage screen
        // so as a global hack I'm just reloading the current state if you switch
        // from foreground to background and back
        document.addEventListener("resume", function () {
            console.log("****The application is resuming from the background");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            console.log("** generated Random of " + $rootScope.rand);
            $state.go($state.current, {}, {
                reload: true
            });
        }, false);


        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }


    });
})

// My route map connecting menu options to their respective templates and controllers
.config(function ($stateProvider, $urlRouterProvider) {


    $stateProvider

    /*.state('app', {
        data: {
            requireLogin: false
        },
        url: "/app",
        abstract: true,
        templateUrl: "templates/intro.html",
        controller: 'zmApp.AppCtrl',


    })*/

        .state('login', {
        data: {
            requireLogin: false
        },
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'zmApp.LoginCtrl',


    })

    .state('monitors', {
        data: {
            requireLogin: false
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.montage resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/monitors",
        templateUrl: "templates/monitors.html",
        controller: 'zmApp.MonitorCtrl',

    })


    .state('events', {
        data: {
            requireLogin: false
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/events/:id",
        templateUrl: "templates/events.html",
        controller: 'zmApp.EventCtrl',

    })

    //n
    .state('events-graphs', {
        data: {
            requireLogin: false
        },
        url: "/events-graphs",
        templateUrl: "templates/events-graphs.html",
        controller: 'zmApp.EventsGraphsCtrl',
    })


    .state('montage', {
        data: {
            requireLogin: false
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.montage resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/montage",
        templateUrl: "templates/montage.html",
        controller: 'zmApp.MontageCtrl',

    });


    // if none of the above states are matched, use this as the fallback
    var defaultState = "/monitors";
    //var defaultState = "/app/montage";
    $urlRouterProvider.otherwise(defaultState);
});
