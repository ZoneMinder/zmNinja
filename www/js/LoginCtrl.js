/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', function ($scope, $rootScope, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.loginData = ZMDataModel.getLogin();



     //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** LoginCtrl  Entered");
        ZMDataModel.setAwake(false);
    });

//-------------------------------------------------------------------------------
// Adds http to url if not present
// http://stackoverflow.com/questions/11300906/check-if-a-string-starts-with-http-using-javascript
//-------------------------------------------------------------------------------
function addhttp(url) {
   if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
   }
   return url;
}

    //-----------------------------------------------------------------------------
    // Perform the login action when the user submits the login form
    //-----------------------------------------------------------------------------
    $scope.save = function () {
        console.log('Saving login');

        if (parseInt($scope.loginData.maxMontage) > 10) {
            $ionicPopup.alert({
                title: 'Note',
                template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
            });
        }

        // lets so some basic sanitization of the data
        // I am already adding "/" so lets remove spurious ones
        // though webkit has no problems. Even so, this is to avoid
        // a deluge of folks who look at the error logs and say
        // the reason the login data is not working is because
        // the app is adding multiple "/" characters

        $scope.loginData.url = $scope.loginData.url.trim();
        $scope.loginData.apiurl = $scope.loginData.apiurl.trim();
        $scope.loginData.username = $scope.loginData.username.trim();
        $scope.loginData.streamingurl = $scope.loginData.streamingurl.trim();

        if ($scope.loginData.url.slice(-1) == '/') {
            $scope.loginData.url = $scope.loginData.url.slice(0, -1);

        }

        if ($scope.loginData.apiurl.slice(-1) == '/') {
            $scope.loginData.apiurl = $scope.loginData.apiurl.slice(0, -1);

        }


        if ($scope.loginData.streamingurl.slice(-1) == '/') {
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -1);

        }

        // strip cgi-bin if it is there but only at the end
        if ($scope.loginData.streamingurl.slice(-7).toLowerCase() == 'cgi-bin') {
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -7);
        }

        // check for protocol and if not put it in

        $scope.loginData.url = addhttp($scope.loginData.url);
         $scope.loginData.apiurl = addhttp($scope.loginData.apiurl);
         $scope.loginData.streamingurl = addhttp($scope.loginData.streamingurl);

        if ($scope.loginData.useSSL)
        {
            // replace all http with https
            $scope.loginData.url = $scope.loginData.url.replace("http:","https:");
            $scope.loginData.apiurl = $scope.loginData.apiurl.replace("http:","https:");
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("http:","https:");

        }
        else
        {
            // replace all https with http
            $scope.loginData.url = $scope.loginData.url.replace("https:","http:");
            $scope.loginData.apiurl = $scope.loginData.apiurl.replace("https:","http:");
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("https:","http:");
        }



        // FIXME:: Do a login id check too

        var apiurl = $scope.loginData.apiurl + '/host/getVersion.json';
        var portalurl = $scope.loginData.url + '/index.php';
        var streamingurl = $scope.loginData.streamingurl +
            '/cgi-bin/zms?user=' + $scope.loginData.username + "&pass=" + $scope.loginData.password;


        console.log("Checking API: " + apiurl + " PORTAL: " + portalurl + " CGI-BIN: " + streamingurl);


        // Let's do a sanity check to see if the URLs are ok

        $ionicLoading.show({
            template: 'Checking data...',
            animation: 'fade-in',
            showBackdrop: true,
            duration: 15000,
            maxWidth: 200,
            showDelay: 0
        });


        $q.all([
    $http.get(apiurl),
    $http.get(portalurl),
    //$http.get(streamingurl),
  ]).then(
            function (results) {
                $ionicLoading.hide();
                //alert("All good");
            },
            function (error) {
                $ionicLoading.hide();
                //alert("Error string" + JSON.stringify(error));

                $ionicPopup.show({
                    title: 'Please Check your settings',
                    template: 'I tried reaching out using the data you provided and failed. This may also be because ZoneMinder is currently not reachable.',
                    buttons: [
                        {
                            text: 'Ok',
                            type: 'button-positive'
                        },
                        {
                            text: 'Details...',
                            onTap: function (e) {
                                $ionicPopup.alert({
                                    title: 'Error Details',
                                    template: JSON.stringify(error)
                                });
                            }
                        }
                    ]
                });

            }

        );
        ZMDataModel.setLogin($scope.loginData);
    };


}]);
