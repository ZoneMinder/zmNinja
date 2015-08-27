/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', ['$scope', '$rootScope','zm', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', 'zmAutoLogin', function ($scope, $rootScope,zm, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, zmAutoLogin) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.loginData = ZMDataModel.getLogin();
    
   $scope.auth={isUseAuth:""};
    $scope.auth.isUseAuth = ($scope.loginData.isUseAuth == '1') ? true:false;

    


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
    // Makes input easier
    //-------------------------------------------------------------------------------

    $scope.portalKeypress = function(evt)
    {

       // if ($scope.loginData.streamingurl.indexOf($scope.loginData.url) !=0)
                $scope.loginData.streamingurl = $scope.loginData.url;

               if ($scope.loginData.streamingurl.slice(-3).toLowerCase() == '/zm') {
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -3);
        }


      // if ($scope.loginData.apiurl.indexOf($scope.loginData.url) !=0)
            $scope.loginData.apiurl = $scope.loginData.url+"/api";
    };
//-------------------------------------------------------------------------------
// Adds http to url if not present
// http://stackoverflow.com/questions/11300906/check-if-a-string-starts-with-http-using-javascript
//-------------------------------------------------------------------------------
function addhttp(url) {

   if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url !="") ) {
      url = "http://" + url;
   }
   return url;
}

    //-----------------------------------------------------------------------------
    // Perform the login action when the user submits the login form
    //-----------------------------------------------------------------------------
    $scope.save = function () {
        console.log('Saving login');

        if (parseInt($scope.loginData.maxMontage) > zm.safeMontageLimit) {
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
        
        $scope.loginData.isUseAuth = ($scope.auth.isUseAuth) ? "1": "0";

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

        var apiurl = $scope.loginData.apiurl + '/host/getVersion.json';
        var portalurl = $scope.loginData.url + '/index.php';
        var streamingurl = $scope.loginData.streamingurl +
            '/cgi-bin/zms?user=' + $scope.loginData.username + "&pass=" + $scope.loginData.password;


        console.log("Checking API: " + apiurl + " PORTAL: " + portalurl + " CGI-BIN: " + streamingurl);
        ZMDataModel.zmLog ("Checking API: " + apiurl + " PORTAL: " + portalurl + " CGI-BIN: " + streamingurl);


  
        
        // Check if isUseAuth is set make sure u/p have a dummy value
        if ($scope.isUseAuth)
        {
            if (!$scope.loginData.username) $scope.loginData.username="x";
            if (!$scope.loginData.password) $scope.loginData.password="x";
            ZMDataModel.zmLog("Authentication is disabled, setting dummy user & pass");
        }
        
        ZMDataModel.setLogin($scope.loginData);
        zmAutoLogin.doLogin("authenticating...")
        // Do the happy menu only if authentication works
        // if it does not work, there is an emitter for auth
        // fail in app.js that will be called to show an error
        // box
        
        .then( function(data)
        {
        
            // Now let's validate if the API works
            // https://github.com/pliablepixels/zmNinja/issues/25
            ZMDataModel.zmLog ("Validating APIs at " + apiurl);
            $http.get(apiurl)
            .success (function (data) {
                            $ionicPopup.alert({
                            title: 'Login validated',
                            template: 'Please explore the menu and enjoy zmNinja!'
                    }).then(function(res) { $ionicSideMenuDelegate.toggleLeft();});
                
            })
            .error (function (error) {
                ZMDataModel.displayBanner ('error',['ZoneMinder API check failed', 'Please check API settings']);
                ZMDataModel.zmLog ("API login error " + JSON.stringify(error));
                $ionicPopup.alert({
                            title: 'Login validated but API failed',
                            template: 'Please check your API settings'
                    });
            });
            
            

        });

    };


}]);
