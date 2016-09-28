angular.module('ionic.ion.headerShrink', [])

    .directive('headerShrink', function ($document) {
    var fadeAmt;

    var shrink = function (header, content, amt, max) {
        amt = Math.min(max, amt);
        fadeAmt = 1 - amt / max;
        ionic.requestAnimationFrame(function () {
            header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + amt + 'px, 0)';
            for (var i = 0, j = header.children.length; i < j; i++) {
                header.children[i].style.opacity = fadeAmt;
            }
        });
    };

    return {
        restrict: 'A',
        link: function ($scope, $element, $attr) {
            var starty = $scope.$eval($attr.headerShrink) || 0;
            var shrinkAmt;

            var amt;

            var y = 0;
            var prevY = 0;
            var scrollDelay = 0.4;

            var fadeAmt;

            var headers = $document[0].body.querySelectorAll('.bar-header');
            var headerHeight = headers[0].offsetHeight;

            function onScroll(e) {
                var scrollTop = e.detail.scrollTop;

                if (scrollTop >= 0) {
                    y = Math.min(headerHeight / scrollDelay, Math.max(0, y + scrollTop - prevY));
                } else {
                    y = 0;
                }
                console.log(scrollTop);

                ionic.requestAnimationFrame(function () {
                    fadeAmt = 1 - (y / headerHeight);
                    for (var k = 0, l = headers.length; k < l; k++) {
                        headers[k].style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + -y + 'px, 0)';
                        headers[k].style.opacity = fadeAmt;
                    }
                });

                prevY = scrollTop;
            }

            $element.bind('scroll', onScroll);
        }
    }
})

angular.module('app', ['ionic', 'ionic.ion.headerShrink'])
    .config(function ($stateProvider, $urlRouterProvider) {

    // Define our views
    $stateProvider.state('home', {
        url: "/home",
        templateUrl: 'views/home.html'
        // If you wanted some AngularJS controller behaviour...
        // controller: "HomeCtrl as ctrl"
    });

    // Default view to show
    $urlRouterProvider.otherwise('/home');
});
