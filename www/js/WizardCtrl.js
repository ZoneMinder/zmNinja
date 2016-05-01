/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry, URI */

angular.module('zmApp.controllers').controller('zmApp.WizardCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel','$ionicSideMenuDelegate', '$ionicHistory', '$state', '$ionicPopup', 'SecuredPopups', '$http','$q','zm',function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate, $ionicHistory, $state, $ionicPopup, SecuredPopups, $http, $q,zm) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };
    
    
    function login (u,zmu,zmp)
    {
        var d = $q.defer();
        
        $http({
                method: 'POST',
                //withCredentials: true,
                url: u,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var params = str.join("&");
                    return params;
                },

                data: {
                    username: zmu,
                    password: zmp,
                    action: "login",
                    view: "console"
                }
            })
            .success (function (data, status,headers){
                console.log ("LOOKING FOR " + zm.loginScreenString);
                //console.log ("DATA RECEIVED " + JSON.stringify(data));
                if (data.indexOf(zm.loginScreenString) == -1)
                {
                    d.resolve(true);
                    return d.promise;
                }
                else
                {
                    console.log ("************ERROR");
                    d.reject(false);
                    return d.promise;
                }
            });
        
        return d.promise;
        
    }
    
    function logout(u)
    {
        var d = $q.defer();
        
        $http({
             method: 'POST',
                url: u,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var params = str.join("&");
                    return params;
                },

                data: {
                    action: "logout",
                    view: "login"
                }
            })
        .finally (function (ans) {
            return d.resolve(true);
            
        });
                      
        
        return d.promise;
        
    }

    $scope.exitValidate = function()
    {
        $rootScope.authSession = 'undefined';
        $rootScope.zmCookie = '';
        
        $scope.portalValidText = "";
        $scope.apiValidateText = "";
        $scope.streamingValidateText = "";
        $scope.wizard.fqportal = "";
        
        var d = $q.defer();
        
        var c = URI.parse ($scope.wizard.portalurl);
        
        var b =""; 
        if ($scope.wizard.useauth && $scope.wizard.usebasicauth)
        {
            b = $scope.wizard.basicuser+":"+$scope.wizard.basicpassword+"@";
            console.log ("B="+b);
        }
        var u = c.scheme+"://"+b+c.host;
        if (c.port) u+= ":"+c.port;
        if (c.path) u+= c.path;
        
        
        if (u.slice(-1) == '/') {
            u = u.slice(0, -1);

        }
        
        $scope.fqportal = u;
    
        u = u+'/index.php';
        ZMDataModel.zmLog ("Wizard: login url is " + u);
        
        // now lets login
        
        var zmu = "x";
        var zmp = "x";
        if ($scope.wizard.usezmauth)
        {
            zmu = $scope.wizard.zmuser;
            zmp = $scope.wizard.zmpassword;
        }
        
        // logout first for the adventurers amongst us who must
        // use it even after logging in
        ZMDataModel.zmLog ("zmWizard: logging out");
        logout(u)
        .then ( function (ans) 
        {
            // login now
            ZMDataModel.zmLog ("zmWizard: logging in with "+u+" "+zmu+":"+zmp);
            login(u,zmu,zmp)
            .then ( function (success){
                ZMDataModel.zmLog ("zmWizard: login succeeded");
                $scope.wizard.portalValidText = "Portal login was successful";
                $scope.wizard.portalColor = "#16a085";
                return d.resolve(true);
            },
            function (error) {
                ZMDataModel.zmLog ("zmWizard: login failed");
                $scope.wizard.portalValidText = "Portal login was unsuccessful";
                $scope.wizard.portalColor = "#e74c3c";
                return d.resolve(false);
                
            });

                
         });//finally
      return d.promise;  
    };
    
    
    //--------------------------------------------------------------------------
    // tags a protocol
    //--------------------------------------------------------------------------
    function checkscheme(url) {

        if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url != "")) {
            return false;
        }
        else
            return true;
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
        
        if ( !checkscheme($scope.wizard.portalurl))
        {
            $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Whoops!',
                    template: 'Please specify http:// or https:// in the url',
                    buttons: [{text: 'Ok'}]
                               
                    });
            return false;
        }
        
        $scope.wizard.portalurl = $scope.wizard.portalurl.toLowerCase().trim();
        
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
        if (c.port) $scope.wizard.portalurl += ":"+c.port;
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
        zmpassword : "",
        ///////////////////////
        loginURL: "",
        apiURL: "",
        streamingURL: "",
        fqportal:"",
        portalValidText:"",
        portalColor:"",
        apiValidText:"",
        apiColor:"",
        streamingValidText:"",
        streamingColor:"",
        
            
        };

    });

}]);
