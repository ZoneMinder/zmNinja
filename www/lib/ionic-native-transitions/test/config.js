export default function ($ionicNativeTransitionsProvider, $stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    'ngInject';
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 500,
        // backInOppositeDirection: true
    });

    $ionicNativeTransitionsProvider.setDefaultTransition({
        type: 'flip',
        direction: 'left'
    });

    $ionicNativeTransitionsProvider.setDefaultBackTransition({
        type: 'slide',
        direction: 'right'
    });

    $ionicNativeTransitionsProvider.enable(false);

    $ionicConfigProvider.tabs.position('top');

    $stateProvider
        .state('tabs', {
            url: "/tab",
            abstract: true,
            templateUrl: "templates/tabs.html"
        })
        .state('tabs.home', {
            url: "/home",
            nativeTransitions: null,
            views: {
                'home-tab': {
                    templateUrl: "templates/home.html"
                }
            }
        })
        .state('tabs.about', {
            url: "/about",
            nativeTransitions: {
                type: "fade"
            },
            views: {
                'about-tab': {
                    templateUrl: "templates/about.html"
                }
            }
        })
        .state('tabs.contact', {
            url: "/contact",
            nativeTransitions: {
                type: "slide",
                direction: "left",
                fixedPixelsTop: 93
            },
            views: {
                'contact-tab': {
                    templateUrl: "templates/contact.html"
                }
            }
        })
        .state('one', {
            url: "/one",
            nativeTransitions: {
                "type": "flip",
                "direction": "up"
            },
            nativeTransitionsAndroid: {
                "type": "flip",
                "direction": "right"
            },
            nativeTransitionsBackAndroid: {
                "type": "slide",
                "direction": "down"
            },
            nativeTransitionsIOS: {
                "type": "flip",
                "direction": "left"
            },
            nativeTransitionsWindowsPhone: {
                "type": "flip",
                "direction": "down"
            },
            templateUrl: "templates/one.html"
        })
        .state('two', {
            url: "/two",
            nativeTransitions: {
                type: "fade"
            },
            nativeTransitionsBack: null,
            nativeTransitionsIOS: {
                "type": "flip",
                "direction": "down" // 'left|right|up|down', default 'right' (Android currently only supports left and right)
            },
            templateUrl: "templates/two.html"
        })
        .state('three', {
            url: "/three",
            nativeTransitions: {
                type: "fade"
            },
            nativeTransitionsAndroid: {
                "type": "slide",
                "direction": "up" // 'left|right|up|down', default 'right' (Android currently only supports left and right)
            },
            nativeTransitionsBackAndroid: {
                "type": "slide",
                "direction": "up" // 'left|right|up|down', default 'right' (Android currently only supports left and right)
            },
            templateUrl: "templates/three.html"
        })
        .state('four', {
            url: "/four?testParamUrl",
            params: {
                test: null
            },
            templateUrl: "templates/four.html",
            controller: function ($stateParams) {
                'ngInject';
                console.log('$stateParams', $stateParams);
            }
        })
        .state('five', {
            url: "/five",
            templateUrl: "templates/five.html",
            controller: function ($stateParams) {
                'ngInject';
                console.log('$stateParams', $stateParams);
            },
            resolve: function ($timeout, $q, $ionicPopup) {
                'ngInject';
                var deferred = $q.defer();
                $timeout(function () {
                    $ionicPopup.show({
                        template: '',
                        title: 'A popup',
                        buttons: [
                            { text: 'Cancel' }
                        ]
                    });
                    deferred.reject();
                }, 1000)
                return deferred.promise;
            }
        });


    $urlRouterProvider.otherwise("/tab/home");
}
