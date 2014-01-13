'use strict';
app.controller('GeolfController', function ($scope) {

    document.addEventListener("deviceready", function() {
        window.plugins.orientationLock.lock("portrait");
    }, false);

    // holes on our generated green
    $scope.holes = [];

    // debug
    $scope.debug = false;
});