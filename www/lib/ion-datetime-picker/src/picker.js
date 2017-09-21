angular.module("ion-datetime-picker", ["ionic"])
    .directive("ionDatetimePicker", function() {
        return {
            restrict: "AE",
            require: "ngModel",
            scope: {
                modelDate: "=ngModel",
                title: "=",
                subTitle: "=",
                buttonOk: "=",
                buttonCancel: "="
            },
            controller: function($scope, $ionicPopup, $ionicPickerI18n, $timeout) {
                $scope.i18n = $ionicPickerI18n;
                $scope.bind = {};

                $scope.rows = [0, 1, 2, 3, 4, 5];
                $scope.cols = [1, 2, 3, 4, 5, 6, 7];
                $scope.weekdays = [0, 1, 2, 3, 4, 5, 6];

                $scope.showPopup = function() {
                    $ionicPopup.show({
                        templateUrl: "picker-popup.html",
                        title: $scope.title || ("Pick " + ($scope.dateEnabled ? "a date" : "") + ($scope.dateEnabled && $scope.timeEnabled ? " and " : "") + ($scope.timeEnabled ? "a time" : "")),
                        subTitle: $scope.subTitle || "",
                        scope: $scope,
                        cssClass: 'ion-datetime-picker-popup',
                        buttons: [
                            {
                                text: $scope.buttonOk || $scope.i18n.ok,
                                type: "button-positive",
                                onTap: function() {
                                    $scope.commit();
                                }
                            }, {
                                text: $scope.buttonCancel || $scope.i18n.cancel,
                                type: "button-stable",
                                onTap: function() {
                                    $timeout(function() {
                                        $scope.processModel();
                                    }, 200);
                                }
                            }
                        ]
                    });
                };

                $scope.prepare = function() {
                    if ($scope.mondayFirst) {
                        $scope.weekdays.push($scope.weekdays.shift());
                    }
                };

                $scope.processModel = function() {
                    var date = $scope.modelDate instanceof Date ? $scope.modelDate : new Date();
                    $scope.year = $scope.dateEnabled ? date.getFullYear() : 0;
                    $scope.month = $scope.dateEnabled ? date.getMonth() : 0;
                    $scope.day = $scope.dateEnabled ? date.getDate() : 0;
                    $scope.hour = $scope.timeEnabled ? date.getHours() : 0;
                    $scope.minute = $scope.timeEnabled ? date.getMinutes() : 0;
                    $scope.second = $scope.secondsEnabled ? date.getSeconds() : 0;

                    changeViewData();
                };

                var changeViewData = function() {
                    var date = new Date($scope.year, $scope.month, $scope.day, $scope.hour, $scope.minute, $scope.second);

                    if ($scope.dateEnabled) {
                        $scope.year = date.getFullYear();
                        $scope.month = date.getMonth();
                        $scope.day = date.getDate();

                        $scope.bind.year = $scope.year;
                        $scope.bind.month = $scope.month.toString();

                        $scope.firstDay = new Date($scope.year, $scope.month, 1).getDay();
                        if ($scope.mondayFirst) {
                            $scope.firstDay = ($scope.firstDay || 7) - 1;
                        }
                        $scope.daysInMonth = new Date($scope.year, $scope.month + 1, 0).getDate();
                        if ($scope.day > $scope.daysInMonth) {
                            $scope.day = $scope.daysInMonth;
                        }
                    }

                    if ($scope.timeEnabled) {
                        $scope.hour = date.getHours();
                        $scope.minute = date.getMinutes();
                        $scope.second = date.getSeconds();
                        $scope.meridiem = $scope.hour < 12 ? "AM" : "PM";

                        $scope.bind.hour = $scope.meridiemEnabled ? ($scope.hour % 12 || 12).toString() : $scope.hour.toString();
                        $scope.bind.minute = ($scope.minute < 10 ? "0" : "") + $scope.minute.toString();
                        $scope.bind.second = ($scope.second < 10 ? "0" : "") + $scope.second.toString();
                        $scope.bind.meridiem = $scope.meridiem;
                    }
                };

                $scope.changeBy = function(value, unit) {
                    if (+value) {
                        // DST workaround
                        if ((unit === "hour" || unit === "minute") && value === -1) {
                            var date = new Date($scope.year, $scope.month, $scope.day, $scope.hour - 1, $scope.minute);
                            if (($scope.minute === 0 || unit === "hour") && $scope.hour === date.getHours()) {
                                $scope.hour--;
                            }
                        }
                        $scope[unit] += +value;
                        changeViewData();
                    }
                };
                $scope.change = function(unit) {
                    var value = $scope.bind[unit];
                    if (value && unit === "meridiem") {
                        value = value.toUpperCase();
                        if (value === "AM" && $scope.meridiem === "PM") {
                            $scope.hour -= 12;
                        } else if (value === "PM" && $scope.meridiem === "AM") {
                            $scope.hour += 12;
                        }
                        changeViewData();
                    } else if (+value || value === "0") {
                        $scope[unit] = +value;
                        changeViewData();
                    }
                };
                $scope.changeDay = function(day) {
                    $scope.day = day;
                    changeViewData();
                };
                $scope.changed = function() {
                    changeViewData();
                };

                if ($scope.dateEnabled) {
                    $scope.$watch(function() {
                        return new Date().getDate();
                    }, function() {
                        var today = new Date();
                        $scope.today = {
                            day: today.getDate(),
                            month: today.getMonth(),
                            year: today.getFullYear()
                        };
                    });
//                    $scope.goToToday = function() {
//                        $scope.year = $scope.today.year;
//                        $scope.month = $scope.today.month;
//                        $scope.day = $scope.today.day;
//
//                        changeViewData();
//                    };
                }
            },
            link: function($scope, $element, $attrs, ngModelCtrl) {
                $scope.dateEnabled = "date" in $attrs && $attrs.date !== "false";
                $scope.timeEnabled = "time" in $attrs && $attrs.time !== "false";
                if ($scope.dateEnabled === false && $scope.timeEnabled === false) {
                    $scope.dateEnabled = $scope.timeEnabled = true;
                }

                $scope.mondayFirst = "mondayFirst" in $attrs && $attrs.mondayFirst !== "false";
                $scope.secondsEnabled = $scope.timeEnabled && "seconds" in $attrs && $attrs.seconds !== "false";
                $scope.meridiemEnabled = $scope.timeEnabled && "amPm" in $attrs && $attrs.amPm !== "false";




                $scope.prepare();

                ngModelCtrl.$render = function() {
                    $scope.modelDate = ngModelCtrl.$viewValue;
                    $scope.processModel();
                };

                $scope.commit = function() {
                    $scope.modelDate = new Date($scope.year, $scope.month, $scope.day, $scope.hour, $scope.minute, $scope.second);
                    ngModelCtrl.$setViewValue($scope.modelDate);
                };

                $element.on("click", $scope.showPopup);
            }
        };
    });
