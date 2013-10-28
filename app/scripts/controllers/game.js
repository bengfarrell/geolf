'use strict';
app.controller('GameController', function ($scope, $location, geotracker, geomath, mapping, state) {
    /**
     * constructor
     */
    $scope.init = function() {
        $scope.state = state;
        geotracker.start();
        geotracker.subscribe(function() {
            if (!$scope.initialized) {
                $scope.initializeGreen();
            }
            if ($scope.ball) {
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.inRange = ($scope.ball.distanceTo < 10);
                mapping.moveMarkerTo($scope.golfer, geotracker.geo.coords);
                $scope.$apply();
            }
        });
    }

    /**
     * initialize golf green around user's location
     */
    $scope.initializeGreen = function() {
        $scope.initialized = true;
        mapping.create("map-canvas");
        $scope.golfer = mapping.addMarker('me', 'me');

        state.setState($scope, 'GamePlay.BeforeTeeOff');
        $scope.currentHole = $scope.holes[0];
        mapping.addMarker('loc', $scope.currentHole.name, $scope.currentHole.location);
        $scope.$apply();
       // places.search(500, $scope.onPlaces);
    }

    /**
     * send camera to find ball
     */
    $scope.findBall = function() {
        state.setState($scope, 'Animating');
        mapping.animateCameraTo($scope.ball.coords, {animation: 'arc', returnToOriginal: true}, function() {
            state.undoState();
        });
    }

    /**
     * tee off
     */
    $scope.teeoff = function() {
        if (!$scope.ball) {
            $scope.ball = mapping.addMarker('ball', 'ball');
            $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
            $scope.ball.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.ball.coords) -90;
            $scope.ball.inRange = ($scope.ball.distanceTo < 10 || self.debug);
        }
        state.setState($scope, 'GamePlay.AfterTeeOff');
        $scope.swing();
    }

    /**
     * swing golf club
     */
    $scope.swing = function() {
        state.setState($scope, 'Animating');
        mapping.animateMarkerBy(
            $scope.ball, $scope.power,
            $scope.direction, {animation: 'arc'}, function() {
                state.undoState();
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.ball.coords) -90;
                $scope.ball.inRange = ($scope.ball.distanceTo < 10) || self.debug;
                $scope.$apply();
            });
    }

    /**
     * on place retrieval
     */
    $scope.onPlaces = function() {
        state.setState($scope, 'GamePlay.BeforeTeeOff');
        var hole = places.getFarthest();
        mapping.addMarker('loc', hole.name, hole.location);
        $scope.$apply();
    }

    /** call c-tor */
    $scope.init();
  });