'use strict';
app.controller('GeolfController', function ($scope, golfer, serviceunavailable) {

    document.addEventListener("deviceready", function() {
        window.plugins.orientationLock.lock("portrait");
    }, false);

    document.addEventListener("pause", function() {
        golfer.stop();
    }, false);

    // holes on our generated green
    $scope.holes = [];

    // debug
    $scope.debug = false;
});