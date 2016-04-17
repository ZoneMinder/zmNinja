export default function(
    $scope,
    $rootScope,
    $log,
    $ionicNativeTransitions,
    $ionicModal,
    $ionicPlatform,
    $ionicHistory
) {

    'ngInject';

    var vm = this;
    vm.modal = null;
    vm.isEnable = $ionicNativeTransitions.isEnabled();
    vm.enable = enable;
    vm.disable = disable;
    vm.stateGo = stateGo;
    vm.locationUrl = locationUrl;
    vm.disableWithoutDisablingIonicTransitions = disableWithoutDisablingIonicTransitions;
    vm.openModal = openModal;
    vm.goBack = goBack;

    $rootScope.$on('ionicNativeTransitions.success', function() {
        $log.info('yeah!');
    });

    $rootScope.$on('ionicNativeTransitions.error', function() {
        $log.info(':(');
    });

    function openModal() {
        if (vm.modal) {
            vm.modal.show();
            return;
        }
        vm.modal = $ionicModal.fromTemplate(`
            <ion-modal-view>
                <ion-header-bar>
                    <h1 class="title">Modal</h1>
                    <button class="button button-clear button-assertive" ng-click="close()">
                        <i class="icon ion-close"></i>
                    </button>
                </ion-header-bar>
                <ion-content class="has-footer has-footer padding">
                    modal
                </ion-content>
            </ion-modal-view>
            `, {
            scope: $rootScope.$new(),
        });
        vm.modal.show();
        vm.modal.scope.close = () => {
            console.log('modal close', JSON.stringify($ionicPlatform.$backButtonActions))
            vm.modal.remove();
            vm.modal = null;
        };
    }

    function enable() {
        $ionicNativeTransitions.enable();
        vm.isEnable = $ionicNativeTransitions.isEnabled();
    }

    function disable() {
        $ionicNativeTransitions.enable(false);
        vm.isEnable = $ionicNativeTransitions.isEnabled();
    }

    function disableWithoutDisablingIonicTransitions() {
        $ionicNativeTransitions.enable(false, true);
        vm.isEnable = $ionicNativeTransitions.isEnabled();
    }

    function stateGo() {
        $ionicNativeTransitions.stateGo('four', {
            test: 'buyakacha!',
            testParamUrl: 'hihi'
        }, {
            "type": "slide",
            "direction": "up", // 'left|right|up|down', default 'left' (which is like 'next')
            "duration": 1500, // in milliseconds (ms), default 400
        }, {
            reload: true
        });
    }

    function locationUrl() {
        $ionicNativeTransitions.locationUrl('/three');
    }

    function goBack(count) {
        console.log('count', count, $ionicHistory.viewHistory())
        $rootScope.$ionicGoBack(count);
    }
}
