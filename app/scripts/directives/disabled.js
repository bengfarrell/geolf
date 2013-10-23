app.directive('ngDisable', function () {
    return function (scope, element, attrs) {
        attrs.$observe('ngDisable', function(actual_value) {
            if (actual_value == "false") {
                actual_value = false;
            }
            if (Boolean(actual_value) == true) {
                element.removeAttr("disabled");
            } else {
                element.attr("disabled", "disabled")
            }
        });
    }
});