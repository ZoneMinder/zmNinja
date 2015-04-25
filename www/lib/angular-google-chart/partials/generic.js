angular.module("google-chart-sample").controller("GenericChartCtrl", function ($scope, $routeParams) {
    $scope.chartObject = {};

    $scope.onions = [
        {v: "Onions"},
        {v: 3},
    ];

    $scope.chartObject.data = {"cols": [
        {id: "t", label: "Topping", type: "string"},
        {id: "s", label: "Slices", type: "number"}
    ], "rows": [
        {c: [
            {v: "Mushrooms"},
            {v: 3},
        ]},
        {c: $scope.onions},
        {c: [
            {v: "Olives"},
            {v: 31}
        ]},
        {c: [
            {v: "Zucchini"},
            {v: 1},
        ]},
        {c: [
            {v: "Pepperoni"},
            {v: 2},
        ]}
    ]};


    // $routeParams.chartType == BarChart or PieChart or ColumnChart...
    $scope.chartObject.type = $routeParams.chartType;
    $scope.chartObject.options = {
        'title': 'How Much Pizza I Ate Last Night'
    }
});

