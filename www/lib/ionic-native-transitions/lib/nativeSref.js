export default function($log, $ionicNativeTransitions, $state) {
    'ngInject';

    return {
        controller: controller,
        restrict: 'A',
        scope: false
    };

    function controller($scope, $element, $attrs, $state) {
        'ngInject';

        let stateOptions = $scope.$eval($attrs.nativeUiSrefOpts) || {};
        let nativeOptions = null;

        $attrs.$observe('nativeOptions', (newOptions) => {
            let evalOptions = $scope.$eval(newOptions);
            nativeOptions = angular.isObject(evalOptions) ? evalOptions : {};
        });

        $element.on('click', (event) => {
            let ref = parseStateRef($attrs.nativeUiSref, $state.current.name);
            let params = angular.copy($scope.$eval(ref.paramExpr));
            if (!$ionicNativeTransitions.isEnabled()) {
                $state.go(ref.state, params, stateOptions);
                return;
            }

            $ionicNativeTransitions.stateGo(ref.state, params, nativeOptions, stateOptions);
        });
    }
}

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
