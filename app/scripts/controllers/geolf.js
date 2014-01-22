'use strict';
app.controller('GeolfController', function ($scope, $location, golfer, serviceunavailable) {

    document.addEventListener("deviceready", function() {
        window.plugins.orientationLock.lock("portrait");
    }, false);

    document.addEventListener("pause", function() {
        golfer.stop();
    }, false);

    // debug
    $scope.debug = false;

    /**
     * go to specific view
     * @param view
     */
    $scope.gotoView = function(view) {
        switch (view) {
            case "scorecard":
                $location.url('/scorecard');
                break;

            case "game":
                $location.url('/game');
                break;
        }
    }
});