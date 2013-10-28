app.directive('state', function () {
    return function (scope, element, attrs) {
        scope.$watch('state.currentState', function(actual_value) {
            if(!actual_value) {
                return;
            }
            if (actual_value.substr(0, attrs.state.length) == attrs.state) {
                element.css("display", "");
            } else {
                element.css("display", "none");
            }
        });
    }
});