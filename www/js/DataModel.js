// This is my central data respository and common functions
// that many other controllers use
// It's grown over time. I guess I may have to split this into multiple services in the future

angular.module('zmApp.controllers').service('ZMDataModel', ['$http', '$q', '$ionicLoading', function ($http, $q, $ionicLoading) {
    // var deferred='';
    var monitorsLoaded = 0;
    var simSize = 30; // how many monitors to simulate
    var montageSize = 3;
    var monitors = [];
    var oldevents = [];
    var loginData = {
        'username': '',
        'password': '',
        'url': '', // This is ZM portal API (Don't add /zm)
        'apiurl': '', // This is the API path
        'simulationMode':false // if true, data will be simulated
    };

    // This is really a test mode. This is how I am validating
    // how my app behaves if you have many monitors. If you set simulationMode above to 1
    // then this is the function that getMonitors and getEvents (not yet) calls

    var simulation = {
        fillSimulatedMonitors: function (cnt) {
            var simmonitors = [];
            console.log("*** Returning " + cnt + " simulated monitors");
            for (var i = 0; i < cnt; i++) {


                simmonitors.push({
                    "Monitor": {
                        // Obviously this is dummy data
                        "Id": i.toString(),
                        "Name": "Monitor Simulation " + i.toString(),
                        "Type": "Remote",
                        "Function": "Modect",
                        "Enabled": "1",
                        "Width": "1280",
                        "Height": "960",
                        "Colours": "4",
                        "MaxFPS": "10.00",
                        "AlarmMaxFPS": "10.00",
                        "AlarmFrameCount": "10.00"
                    }
                });

            }
            // console.log ("Simulated: "+JSON.stringify(simmonitors));
            return simmonitors;
        },
    };

    return {

        // This function is called when the app is ready to run
        // sets up various variables
        // including persistent login data for the ZM apis and portal
        // The reason I need both is because as of today, there is no way
        // to access images using the API and they are authenticated via
        // the ZM portal authentication, which is pretty messy. But unless
        // the ZM authors fix this and streamline the access of images
        // from APIs, I don't have an option

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

            if (window.localStorage.getItem("simulationMode") != undefined) {
                // Remember to convert back to Boolean!
                var tvar = window.localStorage.getItem("simulationMode");
                loginData.simulationMode = ( tvar ==="true");
                console.log ("***** STORED SIMULATION IS "+tvar);
                console.log ("******* BOOLEAN VALUE IS " + loginData.simulationMode);

            }

            monitorsLoaded = 0;
            console.log("Getting out of ZMDataModel init");

        },

        isLoggedIn: function()
        {
            if (loginData.username != "" && loginData.password !="" && loginData.url !="" && loginData.apiurl !="")
            {
                return 1;
            }
            else
                return 0;
            {
            }
        },

        isSimulated: function()
        {
            return loginData.simulationMode;
        },

         setSimulated: function(mode)
        {
             loginData.simulationMode = mode;
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
             window.localStorage.setItem("simulationMode", loginData.simulationMode);
            console.log ("********** SIMULATION IS " + loginData.simulationMode);

        },

        // This function returns a list of monitors
        // if forceReload == 1 then it will force an HTTP API request to get a list of monitors
        // if 0. then it will return back the previously loaded monitor list if one exists, else
        // will issue a new HTTP API to get it

        // I've wrapped this function in my own promise even though http returns a promise. This is because
        // depending on forceReload and simulation mode, http may or may not be called. So I'm promisifying
        // the non http stuff too to keep it consistent to the calling function.

        getMonitors: function (forceReload) {
            console.log("** Inside ZMData getMonitors with forceReload=" + forceReload);
            var d = $q.defer();
            if (((monitorsLoaded == 0) || (forceReload == 1)) && (loginData.simulationMode != true)) // monitors are empty or force reload
            {
                console.log("ZMDataModel: Invoking HTTP get to load monitors");
                var apiurl = loginData.apiurl;
                var myurl = apiurl + "/monitors.json";
                $http.get(myurl)
                    .success(function (data) {
                        //console.log("HTTP success got " + JSON.stringify(data.monitors));
                        monitors = data.monitors;
                        console.log("promise resolved inside HTTP success");
                        monitorsLoaded = 1;
                        d.resolve(monitors);
                    })
                    .error(function (err) {
                        console.log("HTTP Error " + err);
                        // To keep it simple for now, I'm translating an error
                        // to imply no monitors could be loaded. FIXME: conver to proper error
                        monitors = [];
                        console.log("promise resolved inside HTTP fail");
                        d.resolve(monitors);
                    });
                return d.promise;

            } else // monitors are loaded
            {
                if (loginData.simulationMode == true) {
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
        // Not sure if I am using this anymore. I was using this for graphs, but I
        // don't think I am now
        getAllPreexistingEvents: function () {
            console.log("returning " + oldevents.length + " preexisting events");
            return oldevents;
        },

        // This function returns events for  specific monitor or all monitors
        // You get here by tapping on events in the monitor screen or from
        // the menu events option
        // monitorId == 0 means all monitors (ZM starts from 1)

        getEvents: function (monitorId) {

            $ionicLoading.show({
                template: 'Loading ZoneMinder Events...',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });

            console.log("ZMData getEvents called with ID=" + monitorId);
            var d = $q.defer();
            var myevents = [];
            var apiurl = loginData.apiurl;
            var myurl = (monitorId == 0) ? apiurl + "/events.json" : apiurl + "/events/index/MonitorId:" + monitorId + ".json";
            console.log("Constructed URL is " + myurl);
            // FIXME: When retrieving lots of events, I really need to do pagination here - more complex
            // as I have to do that in list scrolling too. For now, I hope your events don't kill the phone
            // memory
            $http.get(myurl)
                .success(function (data) {
                    $ionicLoading.hide();
                    myevents = data.events.reverse();
                    if (monitorId == 0) {
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
                    if (monitorId == 0) {
                        // FIXME: make this into a proper error
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

        // Given a monitor Id it returns the monitor name
        // FIXME: Can I do a better job with associative arrays?
        getMonitorName: function (id) {
            var idnum = parseInt(id);
            for (var i = 0; i < monitors.length; i++) {
                if (parseInt(monitors[i].Monitor.Id) == idnum) {
                    // console.log ("Matched, exiting getMonitorname");
                    return monitors[i].Monitor.Name;
                }

            }
            return "(Unknown)";
        },

        getMontageImagePath: function (){

        var path = "{{LoginData.url}}/cgi-bin/nph-zms?mode=jpeg&amp;monitor={{monitor.Monitor.Id}}&scale=100&maxfps=3&buffer=1000&user={{LoginData.username}}&pass={{LoginData.password}}&rand={{rand}}";

        return (path);
    }


    };
}]);
