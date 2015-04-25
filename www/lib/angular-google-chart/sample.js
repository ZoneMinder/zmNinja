angular.module("google-chart-sample", ["ngRoute", "googlechart"]).config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/fat', {
                templateUrl: 'partials/fat.html',
                controller: 'FatChartCtrl'
            }).
            when('/annotation', {
                templateUrl: 'partials/annotation.html',
                controller: 'AnnotationChartCtrl'
            }).
            when('/generic/:chartType', {
                templateUrl: 'partials/generic.html',
                controller: 'GenericChartCtrl'
            }).
            otherwise({
                redirectTo: '/fat'
            });
    }]).value('googleChartApiConfig', {
            version: '1',
            optionalSettings: {
                packages: ['corechart'],
                language: 'fr'
            }
    });
