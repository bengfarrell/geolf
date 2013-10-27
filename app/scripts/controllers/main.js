'use strict';
app.controller('MainCtrl', function ($scope, geotracker, geomath, places, mapping, state) {
    $scope.state = state;

    /**
     * constructor
     */
    $scope.init = function() {
        geotracker.start();
        geotracker.subscribe(function() {
            if ($scope.ball) {
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.inRange = ($scope.ball.distanceTo < 10);
                mapping.moveMarkerTo($scope.golfer, geotracker.geo.coords);
            }
        });
        state.setState($scope, "PreGame");
    }

    /**
     * initialize golf green around user's location
     * @param use debug mode
     */
    $scope.initializeGreen = function(debugMode) {
        if (debugMode) {
            self.debug = true;
        } else {
            self.debug = false;
        }
        state.setState($scope, 'Initializing');
        mapping.create();
        $scope.golfer = mapping.addMarker('me', 'me');
        places.search(500, $scope.onPlaces);
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