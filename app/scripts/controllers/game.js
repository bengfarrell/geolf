'use strict';
app.controller('GameController', function ($scope, $location, orientation, geotracker, geomath, mapping, state) {
    /**
     * constructor
     */
    $scope.init = function() {
        $scope.state = state;
        $scope.orientation = orientation;
        geotracker.start();

        $scope.$watch('orientation.heading.magneticHeading', function(oldVal, newVal, scope) {
            if (scope.player) {
                var ico = scope.player.marker.getIcon();
                ico.rotation = newVal;
                scope.player.marker.setIcon(ico);
            }
        });

        if (orientation.available) {
            orientation.start();
        }

        geotracker.subscribe(function() {
            if (!$scope.initialized) {
                $scope.initializeGreen();
            }
            if ($scope.ball) {
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.inRange = ($scope.ball.distanceTo < 10);
                mapping.moveMarkerTo($scope.player, geotracker.geo.coords);
            }

            if ($scope.currentHole) {
                $scope.currentHole.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.currentHole.location) -90;
                $scope.currentHole.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.currentHole.location);
            }
            $scope.$apply();
        });
    }

    /**
     * initialize golf green around user's location
     */
    $scope.initializeGreen = function() {
        $scope.initialized = true;
        mapping.create("map-canvas");
        $scope.player = mapping.addMarker('player', 'player');

        state.setState($scope, 'GamePlay.BeforeTeeOff');
        $scope.currentHole = $scope.holes[0];
        mapping.addMarker('loc', $scope.currentHole.name, $scope.currentHole.location);
        $scope.$apply();
    }

    /**
     * send camera to find ball
     */
    $scope.locateBall = function() {
        state.setState($scope, 'Animating');
        mapping.animateCameraTo($scope.ball.coords, {animation: 'arc', returnToOriginal: true}, function() {
            state.undoState();
            $scope.$apply();
        });
    }

    /**
     * send camera to find hole
     */
    $scope.locateHole = function() {
        state.setState($scope, 'Animating');
        mapping.animateCameraTo($scope.currentHole.location, {animation: 'arc', returnToOriginal: true}, function() {
            state.undoState();
            $scope.$apply();
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
            orientation.heading.magneticHeading -270, {animation: 'arc'}, function() {
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