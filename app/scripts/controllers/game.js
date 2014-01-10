'use strict';
app.controller('GameController', function ($scope, $location, compass, geotracker, geomath, mapping, state) {
    /**
     * constructor
     */
    $scope.init = function() {
        $scope.state = state;
        $scope.compass = compass;
        geotracker.start();

        compass.subscribe(function(heading) {
            if ($scope.player) {
                var ico = $scope.player.marker.getIcon();
                ico.rotation = heading.magneticHeading;
                $scope.player.marker.setIcon(ico);
            }
        })

        if (compass.available) {
            compass.start();
        }

        geotracker.subscribe(function() {
            if (!$scope.initialized) {
                $scope.initializeGreen();
            }
            $scope.updateBall();
            $scope.updateHole();

            mapping.moveMarkerTo($scope.player, geotracker.geo.coords);
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

        // reverse to pop
        $scope.holes.reverse();

        $scope.currentHole = $scope.holes.pop();
        $scope.currentHoleMarker = mapping.addMarker('loc', $scope.currentHole.name, $scope.currentHole.location);
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
            $scope.updateBall();
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
            compass.heading.magneticHeading -270, {animation: 'arc'}, function() {
                state.undoState();
                $scope.updateBall();
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

    /**
     * update ball with new coords
     */
    $scope.updateBall = function() {
        if ($scope.ball) {
            $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
            $scope.ball.distanceToHole = geomath.calculateDistance($scope.currentHole.location, $scope.ball.coords);
            $scope.ball.inRange = ($scope.ball.distanceTo < 10) || $scope.debug;

            if ($scope.ball.distanceToHole < 50) {
                $scope.currentHole = $scope.holes.pop();
                mapping.moveMarkerTo($scope.currentHoleMarker, $scope.currentHole.location);
                $scope.updateBall();
                $scope.updateHole();
            }
        }
    }

    /**
     * update hole with new coords
     */
    $scope.updateHole = function() {
        if ($scope.currentHole) {
            $scope.currentHole.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.currentHole.location) -180;
            $scope.currentHole.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.currentHole.location);
        }
    }

    /** call c-tor */
    $scope.init();
  });