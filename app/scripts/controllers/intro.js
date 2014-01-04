'use strict';
app.controller('IntroController', function ($scope, $location) {
    $scope.goToGame = function() {
        $location.url('/setupgame');
    }

    $scope.goToDrivingRange = function() {
        $location.url('/drivingrange');
    }
});