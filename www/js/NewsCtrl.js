/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment*/

angular.module('zmApp.controllers').controller('zmApp.NewsCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$http', 'zm', function ($scope, $rootScope, $ionicModal, NVR, $ionicSideMenuDelegate, $ionicHistory, $state, $http, zm) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //----------------------------------------------------------------
  // Alarm notification handling
  //----------------------------------------------------------------
  $scope.handleAlarms = function () {
    $rootScope.isAlarm = !$rootScope.isAlarm;
    if (!$rootScope.isAlarm) {
      $rootScope.alarmCount = "0";
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go("app.events", {
        "id": 0,
        "playEvent": false
      }, {
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
  
  
  $scope.$on ('$ionicView.beforeEnter', function () {

    $scope.$on ( "process-push", function () {
      NVR.debug (">> NewsCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
    });
  });
  
  $scope.$on('$ionicView.enter', function () {
    // console.log("**VIEW ** News Ctrl Entered");
    NVR.setAwake(false);

  });

  $scope.isUnread = function (itemdate) {
    var lastDate = NVR.getLatestBlogPostChecked();
    //console.log ("BLOG DATE="+itemdate+"  LAST DATE="+lastDate);
    //get("latestBlogPostChecked");
    if (!lastDate) return true;
    var mLastDate = moment(lastDate);
    var mItemDate = moment(itemdate);
    //var unread = mItemDate.diff(mLastDate) >0) ? true:false;
    //console.log (unread);
    return (mItemDate.diff(mLastDate, 'seconds') > 0) ? true : false;

  };

  $scope.loadPost = function (item, itemdate) {
    var lastDate =
      NVR.getLatestBlogPostChecked(); //zmStorageService.get("latestBlogPostChecked");

    if (!lastDate) {
      NVR.debug("First time checking blog posts, I see");
      NVR.setLatestBlogPostChecked(itemdate);
      //zmStorageService.set("latestBlogPostChecked", itemdate);
    } else {
      NVR.debug("last  post checked is " + lastDate);
      NVR.debug("current post dated is " + itemdate);

      var mLastDate = moment(lastDate);
      var mItemDate = moment(itemdate);
      if (mItemDate.diff(mLastDate, 'seconds') > 0) {
        NVR.debug("Updating lastDate to this post");

        NVR.setLatestBlogPostChecked(itemdate); //zmStorageService.set("latestBlogPostChecked", itemdate);

        if (itemdate == $scope.newsItems[0].date) {
          // we are reading the latest post
          $rootScope.newBlogPost = "";
        }
      }

    }

    window.open(item, '_blank', 'location=yes');
    return false;
  };

  $scope.newsItems = [];

  /*

  $http.get(zm.blogUrl, {
      responseType: 'text',
      transformResponse:null
    })
    .then(function (datastr) {
      datastr = datastr.data;
      var trunc = "])}while(1);</x>";
      datastr = datastr.substr(trunc.length);
    
      // 
      var data = JSON.parse(datastr);
      for (var i = 0; i < data.payload.posts.length; i++) {
        $scope.newsItems.push({
          title: data.payload.posts[i].title,
          url: "https://medium.com/zmninja/" + data.payload.posts[i].uniqueSlug,
          date: moment(data.payload.posts[i].createdAt).format("YYYY-MM-DD HH:mm:ss")
        });
      }

    }); */

}]);
