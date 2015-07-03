AppVersionProxy = {
  getVersionNumber: function (successCallback, failCallback, args) {
    var version = Windows.ApplicationModel.Package.current.id.version;
    successCallback([version.major, version.minor, version.build, version.revision].join('.'));
  }
};
cordova.commandProxy.add("AppVersion", AppVersionProxy);
