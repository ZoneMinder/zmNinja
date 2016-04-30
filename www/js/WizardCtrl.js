/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry, URI */

angular.module('zmApp.controllers').controller('zmApp.WizardCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel','$ionicSideMenuDelegate', '$ionicHistory', '$state', '$ionicPopup', 'SecuredPopups',function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate, $ionicHistory, $state, $ionicPopup, SecuredPopups) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

    
    
    
    //--------------------------------------------------------------------------
    // tags a protocol
    //--------------------------------------------------------------------------
    function addhttp(url) {

        if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url != "")) {
            url = "http://" + url;
        }
        return url;
    }
    
    
    //--------------------------------------------------------------------------
    // exit validator for auth wizard
    //--------------------------------------------------------------------------
    
    $scope.exitAuth = function()
    {
        ZMDataModel.zmLog ("Wizard: validating auth syntax");
        if ($scope.wizard.useauth)
        {
            if (!$scope.wizard.usezmauth && !$scope.wizard.usebasicauth)
            {
                $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'You need to enable at least one authentication mechanism',
                    buttons: [{text: 'Ok'}]
                               
                    });
                    return false;
            }
            if ($scope.wizard.usezmauth)
            {
                if ((!$scope.wizard.zmuser) || (!$scope.wizard.zmpassword))
                {
                    $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'Please enter a valid username and password for ZM auth',
                    buttons: [{text: 'Ok'}]
                               
                    });
                    return false;
                }
            }
            
            if ($scope.wizard.usebasicauth)
            {
                if ((!$scope.wizard.basicuser) || (!$scope.wizard.basicpassword))
                {
                    $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'Please enter a valid username and password for basic auth',
                    buttons: [{text: 'Ok'}]
                               
                    });
                    return false;
                }
            }
        }
        return true;
        
    };
    
    //--------------------------------------------------------------------------
    // validator for portal url wizard
    //--------------------------------------------------------------------------
    
    $scope.exitPortal = function()
    {
        ZMDataModel.zmLog ("Wizard: validating portal url syntax");
        
        if (!$scope.wizard.portalurl)
        {
            $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'Portal url cannot be empty',
                    buttons: [{text: 'Ok'}]
                               
                    });
            return false;
        }
        
        $scope.wizard.portalurl = $scope.wizard.portalurl.toLowerCase().trim();
        $scope.wizard.portalurl =   addhttp($scope.wizard.portalurl);
        ZMDataModel.zmLog ("Wizard: stripped url:"+$scope.wizard.portalurl);
        
        var c = URI.parse ($scope.wizard.portalurl);
        
        if (!c.scheme)
        {
            $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'URL seems invalid (no protocol detected)',
                    buttons: [{text: 'Ok'}]
                               
                    });
            return false;
        }
        
        
        if (c.userinfo) // basic auth stuff in here, take it out and put it into the next screen
        {
            $scope.wizard.useauth = true;
            $scope.wizard.usebasicauth = true;
            var barray = c.userinfo.split(":",2);
            $scope.wizard.basicuser = barray[0];
            $scope.wizard.basicpassword = barray[1];
        }   
        
        $scope.wizard.portalurl = c.scheme+"://";
        if (c.host) $scope.wizard.portalurl += c.host;
        if (c.port) $scope.wizard.portalurl += ":"+c.host;
        if (c.path) $scope.wizard.portalurl += c.path;
        ZMDataModel.zmLog ("Wizard: normalized url:"+$scope.wizard.portalurl);
        return true;
    };
    
    //--------------------------------------------------------------------------
    // part of auth wizard - toggles display of auth components
    //--------------------------------------------------------------------------
    $scope.toggleAuth = function()
    {
        $scope.wizard.useauth = !$scope.wizard.useauth;
        if (!$scope.wizard.useauth)
        {
            $scope.wizard.usebasicauth = false;
            $scope.wizard.usezmauth = false;
        }
    };
    
    
    //--------------------------------------------------------------------------
    // global tip toggler for all wizard steps
    //--------------------------------------------------------------------------
    $scope.toggleTip = function()
    {
        $scope.wizard.tipshow = !$scope.wizard.tipshow;
        if ($scope.wizard.tipshow)
                $scope.wizard.tiptext = "hide tip";
        else    
                $scope.wizard.tiptext = "show tip";
    };
    
   
    //--------------------------------------------------------------------------
    // initial
    //--------------------------------------------------------------------------
    $scope.$on('$ionicView.beforeEnter', function () {
        //console.log("**VIEW ** Help Ctrl Entered");
    
        $scope.wizard = {
        tipshow:false,
        tiptext:"show tip",
        useauth:false,
        usebasicauth:false,
        usezmauth:false,
        portalurl: "",
        basicuser : "",
        basicpassword : "",
        zmuser : "",
        zmpassword : ""
        };

    });

}]);
