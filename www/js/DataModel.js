angular.module('zmApp.controllers').service('ZMDataModel', ['$http', '$q', '$ionicLoading', function ($http, $q, $ionicLoading) {
    // var deferred='';
    var monitorsLoaded = 0;
    var simulationMode = 0; // make 1 for simulation
    var simSize = 30;
    var montageSize = 3;
    var monitors = [];
    var oldevents = [];
    var loginData = {
        'username': '',
        'password': '',
        'url': '',
        'apiurl': ''
    };
    //greeas
   
    var simulation = 
        {
            fillSimulatedMonitors: function(cnt)
            {
                var simmonitors = [];
                console.log ("*** Returning "+cnt+" simulated monitors");
                for (var i=0; i < cnt; i++)
                {
                   
                    
                    simmonitors.push(
                        {
                            "Monitor":
                            {
                                "Id":i.toString(),
                                "Name":"Monitor Simulation "+i.toString(),
                                "Type":"Remote",
                                "Function":"Modect",
                                "Enabled":"1",
                                "Width":"1280",
                                "Height":"960",
                                "Colours":"4",
                                "MaxFPS":"10.00",
                                "AlarmMaxFPS":"10.00",
                                "AlarmFrameCount":"10.00"
                            }
                        }
                    );
                    
                }
                console.log ("Simulated: "+JSON.stringify(simmonitors));
                return simmonitors;           
            },
        };

    return {

        init: function () {
            console.log("****** DATAMODEL INIT SERVICE CALLED ********");
            var montageSize = 2;

            if (window.localStorage.getItem("username") != undefined) {
                loginData.username =
                    window.localStorage.getItem("username");

            }
            if (window.localStorage.getItem("password") != undefined) {
                loginData.password =
                    window.localStorage.getItem("password");

            }

            if (window.localStorage.getItem("url") != undefined) {
                loginData.url =
                    window.localStorage.getItem("url");

            }
            
            if (window.localStorage.getItem("apiurl") != undefined) {
                loginData.apiurl =
                    window.localStorage.getItem("apiurl");

            }

            monitorsLoaded = 0;
            console.log("Getting out of ZMDataModel init");

        },
        
        
       
        getLogin: function () {
            return loginData;
        },
        setLogin: function (newLogin) {
            loginData = newLogin;
            window.localStorage.setItem("username", loginData.username);
            window.localStorage.setItem("password", loginData.password);
            window.localStorage.setItem("url", loginData.url);
            window.localStorage.setItem("apiurl", loginData.apiurl);

        },

        getMonitors: function (forceReload) {
            console.log("** Inside ZMData getMonitors with forceReload=" + forceReload);
            var d = $q.defer();
            if (((monitorsLoaded == 0) || (forceReload == 1)) && (simulationMode !=1) ) // monitors are empty or force reload
            {
                console.log("ZMDataModel: Invoking HTTP Factory to load monitors");
                var apiurl = loginData.apiurl;
                var myurl = apiurl + "/monitors.json";
                $http.get(myurl)
                    .success(function (data) {
                         console.log ("HTTP success got " + JSON.stringify(data.monitors));
                        monitors = data.monitors;
                        console.log("promise resolved inside HTTP success");
                        monitorsLoaded = 1;
                        d.resolve(monitors);
                    })
                    .error(function (err) {
                        console.log("HTTP Error " + err);
                        monitors = [];
                        console.log("promise resolved inside HTTP fail");
                        d.resolve(monitors);
                    });
                return d.promise;

            } else // monitors are loaded
            {
                if (simulationMode == 1) 
                {
                    monitors = simulation.fillSimulatedMonitors(simSize);
                    //fillSimulatedMonitors
                }
                console.log("Returning pre-loaded list of " + monitors.length + " monitors");
                d.resolve(monitors);
                return d.promise;
            }

        },
        setMonitors: function (mon) {
            console.log("ZMData setMonitors called with " + mon.length + " monitors");
            monitors = mon;
        },
        
        getAllPreexistingEvents: function()
        {
            console.log ("returning "+oldevents.length+" preexisting events");
            return oldevents;
        },
        
       
        getEvents: function (monitorId) {

            $ionicLoading.show({
                template: 'Loading ZoneMinder Events...',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });

            console.log("ZMData getEvents called with ID="+monitorId);
            var d = $q.defer();
            var myevents = [];
            var apiurl = loginData.apiurl;
            var myurl = (monitorId == 0) ? apiurl + "/events.json" : apiurl + "/events/index/MonitorId:"+monitorId+".json";
            console.log ("Constructed URL is " + myurl);
            $http.get(myurl)
                .success(function (data) {
                    $ionicLoading.hide();
                    myevents = data.events.reverse();
                    if (monitorId == 0)
                    {
                        oldevents = myevents;
                    }
                    //console.log (JSON.stringify(data));
                    console.log("Returning " + myevents.length + "events");
                    d.resolve(myevents);
                    return d.promise;

                })
                .error(function (err) {
                    $ionicLoading.hide();
                    console.log("HTTP Events error " + err);
                    d.resolve(myevents);
                    if (monitorId ==0)
                    {
                        oldevents = [];
                    }
                        return d.promise;
                })
            return d.promise;

        },

        getMontageSize: function () {
            return montageSize;
        },
        setMontageSize: function (montage) {
            montageSize = montage;
        },

        getMonitorsLoaded: function () {
            console.log("**** Inside promise function ");
            var deferred = $q.defer();
            if (monitorsLoaded != 0) {
                deferred.resolve(monitorsLoaded);
            }

            return deferred.promise;
        },
        setMonitorsLoaded: function (loaded) {
            console.log("ZMData.setMonitorsLoaded=" + loaded);
            monitorsLoaded = loaded;
        },

        getMonitorName: function (id) {
            var idnum = parseInt(id);
            // console.log ("I have " + monitors.length + " monitors to match");

            //console.log (JSON.stringify(monitors));
            for (var i = 0; i < monitors.length; i++) {
                // console.log ("Searching for:"+idnum+"& got:"+monitors[i].Monitor.Id);
                //console.log ("Searching for monitors id:"+monitors[i].Mo
                // console.log ("Iteration #"+i+" " +monitors[i].Monitor.Id + " " + monitors[i].Monitor.Name);
                if (parseInt(monitors[i].Monitor.Id) == idnum) {
                    // console.log ("Matched, exiting getMonitorname");
                    return monitors[i].Monitor.Name;
                }

            }
            return "(Unknown)";
        },
        
        
        
    };
}]);