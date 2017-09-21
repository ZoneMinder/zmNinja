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
export default function($ionicNativeTransitions, $ionicPlatform, $ionicHistory, $rootScope) {
    'ngInject';

    $ionicPlatform.ready(() => {
        $ionicNativeTransitions.init();
    });
};
