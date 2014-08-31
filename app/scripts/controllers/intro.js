'use strict';
app.controller('IntroController', function ($scope, $location, pubnub) {

    $scope.playerCount = 0;

    pubnub.start();
    pubnub.subscribe( "players", function(m) {
        console.log(m)
        $scope.playerCount = m.playerCount;
        $scope.$apply();
    });

    $scope.goToGame = function(mode) {
        $location.url('/setupgame/:' + mode);
    }

    $scope.goToDrivingRange = function() {
        $location.url('/drivingrange');
    }
});