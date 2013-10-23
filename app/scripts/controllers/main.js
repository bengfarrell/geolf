'use strict';
app.controller('MainCtrl', function ($scope, geotracker, geomath, places, mapping) {
    $scope.state = 'Initializing';

    /**
     * constructor
     */
    $scope.init = function() {
        geotracker.start();
        geotracker.subscribe(function() {
            if ($scope.ball) {
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.inRange = ($scope.ball.distanceTo < 10);
            }
        });
    }

    /**
     * initialize golf green around user's location
     */
    $scope.initializeGreen = function() {
        $scope.state = 'Initializing';
        mapping.create();
        mapping.addMarker('me', 'me');
        $scope.ball = mapping.addMarker('ball', 'ball');
        $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
        $scope.ball.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.ball.coords) -90;
        $scope.ball.inRange = ($scope.ball.distanceTo < 10);
        places.search(500, $scope.onPlaces);
    }

    /**
     * send camera to find ball
     */
    $scope.findBall = function() {
        $scope.state = 'Animating';
        mapping.animateCameraTo($scope.ball.coords, {animation: 'arc', returnToOriginal: true}, function() {
            $scope.state = 'GamePlay';
        });
    }

    /**
     * swing golf club
     */
    $scope.swing = function() {
        $scope.state = 'Animating';
        mapping.animateMarkerBy(
            $scope.ball, $scope.power,
            $scope.direction, {animation: 'arc'}, function() {
                $scope.state = 'GamePlay';
                $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                $scope.ball.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.ball.coords) -90;
                $scope.ball.inRange = ($scope.ball.distanceTo < 10);
                $scope.$apply();
            });
    }

    /**
     * on place retrieval
     */
    $scope.onPlaces = function() {
        $scope.state = 'GamePlay';
        var hole = places.getFarthest();
        mapping.addMarker('loc', hole.name, hole.location);
        $scope.$apply();
    }

    /** call c-tor */
    $scope.init();
  });