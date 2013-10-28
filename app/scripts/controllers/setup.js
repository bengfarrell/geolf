'use strict';
app.controller('SetupController', function ($scope, $location, geotracker, places, mapping, state) {
    /**
     * constructor
     */
    $scope.init = function() {
        $scope.state = state;
        state.setState($scope, "Loading");
        geotracker.getCurrent(function(geo) {
            mapping.create("map-canvas", geo);
            places.search(500, $scope.onPlaces, geo);
        });
    }

    /**
     * start game
     * @param debugMode
     */
    $scope.startGame = function(debugMode) {
        if (debugMode) {
            $scope.debug = true;
        } else {
            $scope.debug = false;
        }
        $location.url('/game');
    }


    /**
     * on place retrieval
     */
    $scope.onPlaces = function() {
        places.places.reverse();
        for (var c = 0; c < places.places.length; c++) {
            places.places[c].num = c +1;
            if (c < 18)  {
                $scope.holes.push(places.places[c]);
            }
        }
        state.setState($scope, "Loaded");
        $scope.$apply();
    }

    $scope.init();
});