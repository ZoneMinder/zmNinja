/*!
 * ionic-native-transitions
 *  ---
 * Native transitions for Ionic applications
 * @version: v1.0.2
 * @author: shprink <contact@julienrenaux.fr>
 * @link: https://github.com/shprink/ionic-native-transitions
 * @license: MIT
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["ionicNativeTransitions"] = factory();
	else
		root["ionicNativeTransitions"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _providerJs = __webpack_require__(/*! ./provider.js */ 1);
	
	var _providerJs2 = _interopRequireDefault(_providerJs);
	
	var _nativeSrefJs = __webpack_require__(/*! ./nativeSref.js */ 2);
	
	var _nativeSrefJs2 = _interopRequireDefault(_nativeSrefJs);
	
	var _runJs = __webpack_require__(/*! ./run.js */ 3);
	
	var _runJs2 = _interopRequireDefault(_runJs);
	
	var mod = angular.module('ionic-native-transitions', ['ionic', 'ui.router']);
	
	mod.directive('nativeUiSref', _nativeSrefJs2['default']);
	mod.provider('$ionicNativeTransitions', _providerJs2['default']);
	mod.run(_runJs2['default']);
	
	exports['default'] = mod = mod.name;
	module.exports = exports['default'];

/***/ },
/* 1 */
/*!*************************!*\
  !*** ./lib/provider.js ***!
  \*************************/
/***/ function(module, exports) {

	/**
	 * @ngdoc service
	 * @name ionic-native-transitions.$ionicNativeTransitions
	 * @description
	 * ionic-native-transitions service
	 */
	/**
	 * @ngdoc service
	 * @name ionic-native-transitions.$ionicNativeTransitionsProvider
	 * @description
	 * ionic-native-transitions provider
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	exports['default'] = function () {
	    'ngInject';
	
	    var enabled = true,
	        $stateChangeStart = null,
	        $stateChangeSuccess = null,
	        $stateChangeError = null,
	        $stateAfterEnter = null,
	        oppositeDirections = {
	        up: 'down',
	        down: 'up',
	        left: 'right',
	        right: 'left'
	    },
	        defaultTransition = {
	        type: 'slide',
	        direction: 'left'
	    },
	        defaultBackTransition = {
	        type: 'slide',
	        direction: 'right'
	    },
	        defaultOptions = {
	        duration: 400, // in milliseconds (ms), default 400,
	        slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
	        iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
	        androiddelay: -1, // same as above but for Android, default -1
	        winphonedelay: -1, // same as above but for Windows Phone, default -1,
	        fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
	        fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android),
	        triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
	        backInOppositeDirection: false // Disable default back transition and uses the opposite transition to go back
	    };
	
	    $get.$inject = ["$log", "$ionicConfig", "$rootScope", "$timeout", "$state", "$location", "$ionicHistory", "$ionicPlatform"];
	    return {
	        $get: $get,
	        enable: enable,
	        setDefaultTransition: setDefaultTransition,
	        setDefaultBackTransition: setDefaultBackTransition,
	        setDefaultOptions: setDefaultOptions
	    };
	
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitionsProvider#enable
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitionsProvider
	     *
	     * @description
	     * Overwrite default nativepagetransitions plugin options
	     * @param {object} injectedOptions  options that will overwrite defaults
	     */
	    function enable() {
	        var enabled = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
	
	        enable = enabled;
	        return this;
	    }
	
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitionsProvider#isEnabled
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitionsProvider
	     *
	     * @description
	     * Is ionic-native-transitions enabled or not?
	     */
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitions#isEnabled
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitions
	     *
	     * @description
	     * Is ionic-native-transitions enabled or not?
	     */
	    function isEnabled() {
	        if (window.cordova && window.plugins && window.plugins.nativepagetransitions) {
	            return enable;
	        }
	        return false;
	    }
	
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitionsProvider#setDefaultOptions
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitionsProvider
	     *
	     * @description
	     * Overwrite default nativepagetransitions plugin options
	     * @param {object} injectedOptions  options that will overwrite defaults
	     */
	    function setDefaultOptions() {
	        var injectedOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	        angular.extend(defaultOptions, injectedOptions);
	        return this;
	    }
	
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitionsProvider#setDefaultTransition
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitionsProvider
	     *
	     * @description
	     * Overwrite default transitions
	     * @param {object} transitionOptions  options that will overwrite defaults
	     */
	    function setDefaultTransition() {
	        var transition = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	        angular.extend(defaultTransition, transition);
	        return this;
	    }
	
	    /**
	     * @ngdoc function
	     * @name ionic-native-transitions.$ionicNativeTransitionsProvider#setDefaultBackTransition
	     * @access public
	     * @methodOf ionic-native-transitions.$ionicNativeTransitionsProvider
	     *
	     * @description
	     * Overwrite default back transitions
	     * @param {object} transitionOptions  options that will overwrite defaults
	     */
	    function setDefaultBackTransition() {
	        var transition = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	        angular.extend(defaultBackTransition, transition);
	        return this;
	    }
	
	    function $get($log, $ionicConfig, $rootScope, $timeout, $state, $location, $ionicHistory, $ionicPlatform) {
	        'ngInject';
	
	        var legacyGoBack = undefined,
	            backButtonUnregister = undefined;
	
	        return {
	            init: init,
	            getDefaultOptions: getDefaultOptions,
	            enable: enableFromService,
	            isEnabled: isEnabled,
	            transition: transition,
	            registerToRouteEvents: registerToRouteEvents,
	            unregisterToRouteEvents: unregisterToRouteEvents,
	            registerToStateChangeStartEvent: registerToStateChangeStartEvent,
	            unregisterToStateChangeStartEvent: unregisterToStateChangeStartEvent,
	            disablePendingTransition: disablePendingTransition,
	            locationUrl: locationUrl,
	            stateGo: stateGo,
	            goBack: goBack
	        };
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#locationUrl
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         *
	         * @description
	         * Call location url and apply a native transition
	         * @param {string|null} url                 default:null
	         * @param {object|null} transitionOptions   default:null
	         */
	        function locationUrl() {
	            var url = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
	            var transitionOptions = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
	
	            if (!url) {
	                $log.debug('[native transition] cannot change url without url...');
	                return;
	            }
	            unregisterToStateChangeStartEvent();
	            var locationPromise = $location.url(url);
	            transition(transitionOptions);
	
	            return locationPromise;
	        }
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#stateGo
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         *
	         * @description
	         * Call state go and apply a native transition
	         * @param {string|null} state              default:null
	         * @param {object}      stateParams        default:{}
	         * @param {object}      stateOptions       default:{}
	         * @param {object|null} transitionOptions  default:null
	         */
	        function stateGo() {
	            var state = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
	            var stateParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	            var stateOptions = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
	            var transitionOptions = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
	
	            if (!state) {
	                $log.debug('[native transition] cannot change state without a state...');
	                return;
	            }
	
	            if ($state.is(state, stateParams) && !stateOptions.reload) {
	                $log.debug('[native transition] same state transition are not possible');
	                return;
	            }
	
	            unregisterToStateChangeStartEvent();
	            transition(transitionOptions);
	            return $timeout(function () {
	                return $state.go(state, stateParams, stateOptions);
	            });
	        }
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#enable
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         *
	         * @description
	         * enable/disable plugin
	         * @param {boolean} enabled
	         * @param {boolean} disableIonicTransitions
	         * @param {string}  ionicTransitionType
	         */
	        function enableFromService() {
	            var enabled = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
	            var disableIonicTransitions = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
	            var ionicTransitionType = arguments.length <= 2 || arguments[2] === undefined ? 'platform' : arguments[2];
	
	            if (enabled && !(window.cordova && window.plugins && window.plugins.nativepagetransitions)) {
	                $log.debug('[native transition] is disabled or nativepagetransitions plugin is not present');
	                return;
	            }
	            enable = enabled;
	
	            if (enabled) {
	                $log.debug('[native transition] enabling plugin');
	                if (window.plugins && window.plugins.nativepagetransitions) {
	                    angular.extend(window.plugins.nativepagetransitions.globalOptions, getDefaultOptions());
	                }
	                $rootScope.$ionicGoBack = goBack;
	                backButtonUnregister = $ionicPlatform.registerBackButtonAction(function (e, count) {
	                    return goBack(count);
	                }, 100);
	                registerToRouteEvents();
	            } else {
	                $log.debug('[native transition] disabling plugin');
	                if (typeof arguments[1] === 'undefined') {
	                    disableIonicTransitions = false;
	                }
	                $rootScope.$ionicGoBack = legacyGoBack;
	                if (angular.isFunction(backButtonUnregister)) {
	                    backButtonUnregister.call();
	                }
	                unregisterToRouteEvents();
	            }
	
	            if (disableIonicTransitions) {
	                $log.debug('[native transition] disabling ionic transitions');
	                $ionicConfig.views.transition('none');
	            } else {
	                $log.debug('[native transition] enabling ionic transitions');
	                $ionicConfig.views.transition(ionicTransitionType);
	            }
	
	            return this;
	        }
	
	        function transition() {
	            if (!isEnabled()) {
	                return;
	            }
	            var options = {};
	            if (angular.isObject(arguments[0])) {
	                options = angular.extend({}, defaultBackTransition, arguments[0]);
	            } else if (angular.isString(arguments[0])) {
	                switch (arguments[0]) {
	                    case 'back':
	                        // First we check for state back transition
	                        if (arguments[2] && getBackStateTransition(arguments[2])) {
	                            options = getBackStateTransition(arguments[2]);
	                            console.log('back first', options);
	                        } // Then we check if the backInOppositeDirection option is enabled
	                        else if (getDefaultOptions().backInOppositeDirection && arguments[1] && getStateTransition(arguments[1])) {
	                                options = getStateTransition(arguments[1]);
	                                if (options.direction) {
	                                    options.direction = oppositeDirections[options.direction];
	                                }
	                                console.log('back second', options);
	                            } // otherwise we just use the default transition
	                            else {
	                                    options = defaultBackTransition;
	                                    console.log('back default', options);
	                                }
	                        break;
	                }
	            } else {
	                options = defaultTransition;
	            }
	            options = angular.copy(options);
	            $log.debug('[native transition]', options);
	            var type = options.type;
	            delete options.type;
	            $rootScope.$broadcast('ionicNativeTransitions.beforeTransition');
	            window.plugins.nativepagetransitions[type](options, transitionSuccess.bind(this, getTransitionDuration(options)), transitionError.bind(this, getTransitionDuration(options)));
	        }
	
	        function transitionSuccess(duration) {
	            setTimeout(function () {
	                return $rootScope.$broadcast('ionicNativeTransitions.success');
	            }, duration);
	        }
	
	        function transitionError(duration) {
	            setTimeout(function () {
	                return $rootScope.$broadcast('ionicNativeTransitions.error');
	            }, duration);
	        }
	
	        function getTransitionDuration(options) {
	            var duration = undefined;
	            if (options.duration) {
	                duration = parseInt(options.duration);
	            } else {
	                duration = parseInt(getDefaultOptions().duration);
	            }
	            if (ionic.Platform.isAndroid()) {
	                if (options.androiddelay) {
	                    duration += parseInt(options.androiddelay);
	                } else {
	                    duration += parseInt(getDefaultOptions().androiddelay);
	                }
	            } else if (ionic.Platform.isIOS()) {
	                if (options.iosdelay) {
	                    duration += parseInt(options.iosdelay);
	                } else {
	                    duration += parseInt(getDefaultOptions().iosdelay);
	                }
	            } else if (ionic.Platform.isWindowsPhone()) {
	                if (options.winphonedelay) {
	                    duration += parseInt(options.winphonedelay);
	                } else {
	                    duration += parseInt(getDefaultOptions().winphonedelay);
	                }
	            }
	            return duration;
	        }
	
	        function executePendingTransition() {
	            window.plugins.nativepagetransitions.executePendingTransition();
	            // $rootScope.$broadcast('ionicNativeTransitions.', executePendingTransition);
	            registerToStateChangeStartEvent();
	        }
	
	        function disablePendingTransition() {
	            // If native transition support cancelling transition (> 0.6.4), cancel pending transition
	            if (window.plugins && window.plugins.nativepagetransitions && angular.isFunction(window.plugins.nativepagetransitions.cancelPendingTransition)) {
	                window.plugins.nativepagetransitions.cancelPendingTransition();
	                registerToStateChangeStartEvent();
	            } else {
	                executePendingTransition();
	            }
	        }
	
	        function registerToRouteEvents() {
	            unregisterToRouteEvents();
	            registerToStateChangeStartEvent();
	            // $stateChangeSuccess = $rootScope.$on('$stateChangeSuccess', executePendingTransition);
	            $stateChangeError = $rootScope.$on('$stateChangeError', disablePendingTransition);
	            $stateAfterEnter = $rootScope.$on(getDefaultOptions().triggerTransitionEvent, executePendingTransition);
	        }
	
	        function registerToStateChangeStartEvent() {
	            if ($stateChangeStart) {
	                return;
	            }
	            $stateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
	                var options = null;
	                // Abort if event was preventDefault'ed
	                if (event.defaultPrevented) {
	                    return;
	                }
	                // Disable native transition for this state
	                if (toState.nativeTransitions === null) {
	                    $log.debug('[native transition] transition disabled for this state', toState);
	                    return;
	                }
	                options = getStateTransition(toState);
	                $log.debug('[native transition] $stateChangeStart', toState, options);
	                transition(options);
	            });
	        }
	
	        function getBackStateTransition(state) {
	            if (angular.isObject(state.nativeTransitionsBackIOS) && ionic.Platform.isIOS()) {
	                return angular.extend({}, state.nativeTransitionsBackIOS);
	            } else if (angular.isObject(state.nativeTransitionsBackAndroid) && ionic.Platform.isAndroid()) {
	                return angular.extend({}, state.nativeTransitionsBackAndroid);
	            } else if (angular.isObject(state.nativeTransitionsBackWindowsPhone) && ionic.Platform.isWindowsPhone()) {
	                return angular.extend({}, state.nativeTransitionsBackWindowsPhone);
	            } else if (angular.isObject(state.nativeTransitionsBack)) {
	                return angular.extend({}, state.nativeTransitionsBack);
	            }
	            return null;
	        }
	
	        function getStateTransition(state) {
	            if (angular.isObject(state.nativeTransitionsIOS) && ionic.Platform.isIOS()) {
	                return angular.extend({}, state.nativeTransitionsIOS);
	            } else if (angular.isObject(state.nativeTransitionsAndroid) && ionic.Platform.isAndroid()) {
	                return angular.extend({}, state.nativeTransitionsAndroid);
	            } else if (angular.isObject(state.nativeTransitionsWindowsPhone) && ionic.Platform.isWindowsPhone()) {
	                return angular.extend({}, state.nativeTransitionsWindowsPhone);
	            } else if (angular.isObject(state.nativeTransitions)) {
	                return angular.extend({}, state.nativeTransitions);
	            }
	            return null;
	        }
	
	        function unregisterToStateChangeStartEvent() {
	            if ($stateChangeStart && angular.isFunction($stateChangeStart)) {
	                $stateChangeStart();
	                $stateChangeStart = null;
	            }
	        }
	
	        function unregisterToRouteEvents() {
	            if ($stateChangeStart && angular.isFunction($stateChangeStart)) {
	                $stateChangeStart();
	                $stateChangeStart = null;
	            }
	            if ($stateChangeSuccess && angular.isFunction($stateChangeSuccess)) {
	                $stateChangeSuccess();
	                $stateChangeSuccess = null;
	            }
	            if ($stateChangeError && angular.isFunction($stateChangeError)) {
	                $stateChangeError();
	                $stateChangeError = null;
	            }
	            if ($stateAfterEnter && angular.isFunction($stateAfterEnter)) {
	                $stateAfterEnter();
	                $stateAfterEnter = null;
	            }
	        }
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#getDefaultOptions
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         *
	         * @description
	         * Get default options
	         */
	        function getDefaultOptions() {
	            return defaultOptions;
	        }
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#init
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         *
	         * @description
	         * Init nativepagetransitions plugin
	         */
	        function init() {
	            legacyGoBack = $rootScope.$ionicGoBack;
	            if (!isEnabled()) {
	                $log.debug('[native transition] The plugin is either disabled or nativepagetransitions plugin by telerik is not present. If you are getting this message in a browser, this is normal behavior, native transitions only work on device.');
	                return;
	            } else {
	                enableFromService();
	            }
	        }
	
	        /**
	         * @ngdoc function
	         * @name ionic-native-transitions.$ionicNativeTransitions#goBack
	         * @access public
	         * @methodOf ionic-native-transitions.$ionicNativeTransitions
	         * @description Navigate back in the current history stack with a back navigation transition
	         * @param {number} backCount - The number of views to go back to. default will be the previous view
	         */
	        function goBack(backCount) {
	
	            if (!$ionicHistory.backView()) {
	                // Close the app when no more history
	                if (navigator.app) {
	                    navigator.app.exitApp();
	                }
	                return;
	            }
	            if (backCount >= 0) {
	                return;
	            }
	            var stateName = $ionicHistory.backView().stateName;
	
	            // Use backCount to find next state only if its defined, else pass as it is to $ionicHistory.goBack
	            // which defaults to previous view transition
	            // Get current history stack and find the cursor for the new view
	            // Based on the new cursor, find the new state to transition to
	            if (!!backCount && !isNaN(parseInt(backCount))) {
	                var viewHistory = $ionicHistory.viewHistory();
	                var currentHistory = viewHistory.histories[$ionicHistory.currentView().historyId];
	                var newCursor = currentHistory.cursor + backCount;
	
	                // If new cursor is more than the max possible or less than zero, default it to first view in history
	                if (newCursor < 0 || newCursor > currentHistory.stack.length) {
	                    newCursor = 0;
	                }
	
	                stateName = currentHistory.stack[newCursor].stateName;
	            }
	            var currentStateTransition = angular.extend({}, $state.current);
	            var toStateTransition = angular.extend({}, $state.get(stateName));
	
	            unregisterToStateChangeStartEvent();
	            if (toStateTransition.nativeTransitionsBack === null) {
	                $log.debug('[native transition] transition disabled for this state', toStateTransition);
	                return $timeout(function () {
	                    return $ionicHistory.goBack(backCount);
	                }).then(function () {
	                    return registerToStateChangeStartEvent();
	                });
	            }
	            $log.debug('nativepagetransitions goBack', backCount, stateName, currentStateTransition, toStateTransition);
	            transition('back', currentStateTransition, toStateTransition);
	            return $timeout(function () {
	                return $ionicHistory.goBack(backCount);
	            });
	        }
	    }
	};
	
	;
	module.exports = exports['default'];

/***/ },
/* 2 */
/*!***************************!*\
  !*** ./lib/nativeSref.js ***!
  \***************************/
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	exports['default'] = ["$log", "$ionicNativeTransitions", "$state", function ($log, $ionicNativeTransitions, $state) {
	    'ngInject';
	
	    controller.$inject = ["$scope", "$element", "$attrs", "$state"];
	    return {
	        controller: controller,
	        restrict: 'A',
	        scope: false
	    };
	
	    function controller($scope, $element, $attrs, $state) {
	        'ngInject';
	
	        var stateOptions = $scope.$eval($attrs.nativeUiSrefOpts) || {};
	        var nativeOptions = null;
	
	        $attrs.$observe('nativeOptions', function (newOptions) {
	            var evalOptions = $scope.$eval(newOptions);
	            nativeOptions = angular.isObject(evalOptions) ? evalOptions : {};
	        });
	
	        $element.on('click', function (event) {
	            var ref = parseStateRef($attrs.nativeUiSref, $state.current.name);
	            var params = angular.copy($scope.$eval(ref.paramExpr));
	            if (!$ionicNativeTransitions.isEnabled()) {
	                $state.go(ref.state, params, stateOptions);
	                return;
	            }
	
	            $ionicNativeTransitions.stateGo(ref.state, params, stateOptions, nativeOptions);
	        });
	    }
	}];
	
	function parseStateRef(ref, current) {
	    var preparsed = ref.match(/^\s*({[^}]*})\s*$/),
	        parsed;
	    if (preparsed) ref = current + '(' + preparsed[1] + ')';
	    parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
	    if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
	    return {
	        state: parsed[1],
	        paramExpr: parsed[3] || null
	    };
	}
	module.exports = exports['default'];

/***/ },
/* 3 */
/*!********************!*\
  !*** ./lib/run.js ***!
  \********************/
/***/ function(module, exports) {

	/**
	 * @ngdoc service
	 * @name ionic-native-transitions.$ionicNativeTransitions
	 * @description
	 * ionic-native-transitions service
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	exports['default'] = ["$ionicNativeTransitions", "$ionicPlatform", "$ionicHistory", "$rootScope", function ($ionicNativeTransitions, $ionicPlatform, $ionicHistory, $rootScope) {
	  'ngInject';
	
	  $ionicPlatform.ready(function () {
	    $ionicNativeTransitions.init();
	  });
	}];
	
	;
	module.exports = exports['default'];
	/**
	 * @ngdoc service
	 * @name ionic-native-transitions.$ionicNativeTransitionsProvider
	 * @description
	 * ionic-native-transitions provider
	 */

/***/ }
/******/ ])
});
;
//# sourceMappingURL=ionic-native-transitions.js.map