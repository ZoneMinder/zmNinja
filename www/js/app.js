// core app start stuff
angular.module('zmApp', [
                            'ionic',
                            'zmApp.controllers',

                        ])

.run(function ($ionicPlatform, $ionicPopup, $rootScope, $state, ZMDataModel,$cordovaSplashscreen) {

    setTimeout(function() {
    $cordovaSplashscreen.hide()
  }, 5000)

    ZMDataModel.init();
    var loginData = ZMDataModel.getLogin();

    if (ZMDataModel.isLoggedIn()) {
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


    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        //   console.log ("***** STATE CHANGE CHECK ****");
        var requireLogin = toState.data.requireLogin;

        if (ZMDataModel.isLoggedIn() || ZMDataModel.isSimulated())
        {
            console.log ("State transition is authorized");
            return;
        }

        if (requireLogin) {

           // alert ("Not logged in");
            console.log ("**** STATE from "+ "**** STATE TO " + toState.name);

           $ionicPopup.alert ({title: "Credentials Required",
                             template:"Please provide your ZoneMinder credentials or switch to simulation mode"});
            // for whatever reason, .go was resulting in digest loops.
            // if you don't prevent, states will stack
            event.preventDefault();
            $state.transitionTo('login');
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
            requireLogin: true
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
            requireLogin: true
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
            requireLogin: true
        },
        url: "/events-graphs",
        templateUrl: "templates/events-graphs.html",
        controller: 'zmApp.EventsGraphsCtrl',
    })


    .state('montage', {
        data: {
            requireLogin: true
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
    //var defaultState = "/login";
    // as it turns out I can't really inject a factory in config the normal way
    // FIXME: In future, read up http://stackoverflow.com/questions/15937267/inject-service-in-app-config
    //var defaultState = (ZMDataModel.isLoggedIn())?  "/monitors":"/login";

    //$urlRouterProvider.otherwise(defaultState);

    // https://github.com/angular-ui/ui-router/issues/600
    // If I start using the urlRouterProvider above and the
    // first state is monitors it goes into a digest loop.

     $urlRouterProvider.otherwise( function($injector, $location) {
            var $state = $injector.get("$state");
            $state.go("monitors");
        });

});
