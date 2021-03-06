app.directive('compass', function () {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            attrs.$observe("direction", function(value) {
                element.css({"-webkit-transform": "rotate(" + value + "deg)"});
            });
        }
    }
});