/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment*/

angular.module('zmApp.controllers').controller('zmApp.NewsCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVRDataModel', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$http', 'zm', function($scope, $rootScope, $ionicModal, NVRDataModel, $ionicSideMenuDelegate, $ionicHistory, $state, $http, zm)
{
    $scope.openMenu = function()
    {
        $ionicSideMenuDelegate.toggleLeft();
    };

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions(
            {
                disableBack: true
            });
            $state.go("events",
            {
                "id": 0,
                "playEvent": false
            },
            {
                reload: true
            });
            return;
        }
    };

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function()
    {
        // console.log("**VIEW ** News Ctrl Entered");
        NVRDataModel.setAwake(false);

    });

    $scope.isUnread = function(itemdate)
    {
        var lastDate = NVRDataModel.getLatestBlogPostChecked();
        //console.log ("BLOG DATE="+itemdate+"  LAST DATE="+lastDate);
        //get("latestBlogPostChecked");
        if (!lastDate) return true;
        var mLastDate = moment(lastDate);
        var mItemDate = moment(itemdate);
        //var unread = mItemDate.diff(mLastDate) >0) ? true:false;
        //console.log (unread);
        return (mItemDate.diff(mLastDate, 'seconds') > 0) ? true : false;

    };

    $scope.loadPost = function(item, itemdate)
    {
        var lastDate =
            NVRDataModel.getLatestBlogPostChecked(); //zmStorageService.get("latestBlogPostChecked");

        if (!lastDate)
        {
            NVRDataModel.debug("First time checking blog posts, I see");
            NVRDataModel.setLatestBlogPostChecked(itemdate);
            //zmStorageService.set("latestBlogPostChecked", itemdate);
        }
        else
        {
            NVRDataModel.debug("last  post checked is " + lastDate);
            NVRDataModel.debug("current post dated is " + itemdate);

            var mLastDate = moment(lastDate);
            var mItemDate = moment(itemdate);
            if (mItemDate.diff(mLastDate, 'seconds') > 0)
            {
                NVRDataModel.debug("Updating lastDate to this post");

                NVRDataModel.setLatestBlogPostChecked(itemdate); //zmStorageService.set("latestBlogPostChecked", itemdate);

                if (itemdate == $scope.newsItems[0].date)
                {
                    // we are reading the latest post
                    $rootScope.newBlogPost = "";
                }
            }

        }
        
        window.open(item, '_blank', 'location=yes');
        return false;
    };

    $scope.newsItems = [];

    
    $http.get(zm.blogUrl, 
        {transformResponse: function(d,h) 
            { 
                var trunc = "])}while(1);</x>";
                d = d.substr(trunc.length);
                return d;
            }
        })
        .success(function(datastr)
        {
            
            
            // console.log ("DATA:"+data);
            // 
            var data = JSON.parse(datastr);
            for (var i = 0; i < data.payload.posts.length; i++)
            {
                $scope.newsItems.push(
                {
                    title: data.payload.posts[i].title,
                    url: "https://medium.com/zmninja/"+data.payload.posts[i].uniqueSlug,
                    date: moment(data.payload.posts[i].createdAt).format("YYYY-MM-DD HH:mm:ss")
                });
            }

        });

}]);
