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
export default function () {
    'ngInject';

    let enabled = true,
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

    return {
        $get,
        enable,
        setDefaultTransition,
        setDefaultBackTransition,
        setDefaultOptions
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
    function enable(enabled = true) {
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
    function setDefaultOptions(injectedOptions = {}) {
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
    function setDefaultTransition(transition = {}) {
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
    function setDefaultBackTransition(transition = {}) {
        angular.extend(defaultBackTransition, transition);
        return this;
    }

    function $get($log, $ionicConfig, $rootScope, $timeout, $state, $location, $ionicHistory, $ionicPlatform) {
        'ngInject';

        let legacyGoBack, backButtonUnregister;

        return {
            init,
            getDefaultOptions,
            enable: enableFromService,
            isEnabled,
            transition,
            registerToRouteEvents,
            unregisterToRouteEvents,
            registerToStateChangeStartEvent,
            unregisterToStateChangeStartEvent,
            disablePendingTransition,
            locationUrl,
            stateGo,
            goBack
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
        function locationUrl(url = null, transitionOptions = null) {
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
        function stateGo(state = null, stateParams = {}, stateOptions = {}, transitionOptions = null) {
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
            return $timeout(() => $state.go(state, stateParams, stateOptions));
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
        function enableFromService(enabled = true, disableIonicTransitions = true, ionicTransitionType = 'platform') {
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
                backButtonUnregister = $ionicPlatform.registerBackButtonAction((e, count) => goBack(count), 100);
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
            let options = {}
            if (angular.isObject(arguments[0])) {
                options = angular.extend({}, defaultBackTransition, arguments[0])
            } else if (angular.isString(arguments[0])) {
                switch (arguments[0]) {
                    case 'back':
                        // First we check for state back transition
                        if (arguments[2] && getBackStateTransition(arguments[2])) {
                            options = getBackStateTransition(arguments[2]);
                            console.log('back first', options)
                        } // Then we check if the backInOppositeDirection option is enabled
                        else if (getDefaultOptions().backInOppositeDirection && arguments[1] && getStateTransition(arguments[1])) {
                            options = getStateTransition(arguments[1]);
                            if (options.direction) {
                                options.direction = oppositeDirections[options.direction];
                            }
                            console.log('back second', options)

                        } // otherwise we just use the default transition
                        else {
                            options = defaultBackTransition;
                            console.log('back default', options)
                        }
                        break;
                }
            } else {
                options = defaultTransition;
            }
            options = angular.copy(options);
            $log.debug('[native transition]', options);
            let type = options.type;
            delete options.type;
            $rootScope.$broadcast('ionicNativeTransitions.beforeTransition');
            window.plugins.nativepagetransitions[type](
                options,
                transitionSuccess.bind(this, getTransitionDuration(options)),
                transitionError.bind(this, getTransitionDuration(options))
            )
        }

        function transitionSuccess(duration) {
            setTimeout(() => $rootScope.$broadcast('ionicNativeTransitions.success'), duration);
        }

        function transitionError(duration) {
            setTimeout(() => $rootScope.$broadcast('ionicNativeTransitions.error'), duration);
        }

        function getTransitionDuration(options) {
            let duration;
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
            $stateChangeStart = $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
                let options = null;
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
            let stateName = $ionicHistory.backView().stateName;

            // Use backCount to find next state only if its defined, else pass as it is to $ionicHistory.goBack
            // which defaults to previous view transition
            // Get current history stack and find the cursor for the new view
            // Based on the new cursor, find the new state to transition to
            if (!!backCount && !isNaN(parseInt(backCount))) {
                let viewHistory = $ionicHistory.viewHistory();
                let currentHistory = viewHistory.histories[$ionicHistory.currentView().historyId];
                let newCursor = currentHistory.cursor + backCount;

                // If new cursor is more than the max possible or less than zero, default it to first view in history
                if (newCursor < 0 || newCursor > currentHistory.stack.length) {
                    newCursor = 0;
                }

                stateName = currentHistory.stack[newCursor].stateName;
            }
            let currentStateTransition = angular.extend({}, $state.current);
            let toStateTransition = angular.extend({}, $state.get(stateName));

            unregisterToStateChangeStartEvent();
            if (toStateTransition.nativeTransitionsBack === null) {
                $log.debug('[native transition] transition disabled for this state', toStateTransition);
                return $timeout(() => $ionicHistory.goBack(backCount)).then(() => registerToStateChangeStartEvent());
            }
            $log.debug('nativepagetransitions goBack', backCount, stateName, currentStateTransition, toStateTransition);
            transition('back', currentStateTransition, toStateTransition);
            return $timeout(() => $ionicHistory.goBack(backCount));
        }
    }
};
