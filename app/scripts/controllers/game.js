'use strict';
app.controller('GameController', function ($scope, $location, compass, geotracker, geomath, mapping, state, golfer) {

    /**
     * init controller
     */
    $scope.init = function() {
        $scope.$on('$destroy', function () {
            golfer.stop();
        });

        $scope.state = state;
        geotracker.subscribe(function(geo) {
            if (!$scope.initialized) {
                $scope.initializeGreen(geo);
            }
            $scope.updateBall();
            $scope.updateHole();

            mapping.moveMarkerTo($scope.player, geo.coords);
            $scope.$apply();
        });
        geotracker.start();
    }

    /**
     * select club
     * @param club
     */
    $scope.selectClub = function(club) {
        golfer.club = club;
    }

    /**
     * golfer event
     */
    $scope.onGolferEvent = function(event, params) {
        switch(event) {
            case "compassUpdate":
                if ($scope.player) {
                    var ico = $scope.player.marker.getIcon();
                    ico.rotation = params.heading;
                    $scope.player.marker.setIcon(ico);
                    $scope.heading = params.heading;
                }
                break;

            case "inPosition":
                if (!$scope.ball) {
                    $scope.ball = mapping.addMarker('ball', 'ball');
                    $scope.updateBall();
                }
                break;

            case "swingComplete":
                $scope.swingDetails = params;
                state.setState($scope, 'Animating');
                $scope.$apply();

                var path = 'arc';
                if (params.club == 'putter') {
                    path = 'straight';
                }
                mapping.animateMarkerBy(
                    $scope.ball, params.power, params.direction, {animation: path}, function() {
                        $scope.updateBall();
                        state.setState($scope, 'GamePlay.AfterTeeOff');
                        $scope.$apply();
                    });
                break;
        }
    }

    /**
     * initialize golf green around user's location
     */
    $scope.initializeGreen = function(geo) {
        $scope.initialized = true;
        mapping.create("map-canvas", geo);
        $scope.player = mapping.addMarker('player', 'player', geo.coords);
        $scope.ball = mapping.addMarker('ball', 'ball', geo.coords);

        golfer.start();
        $scope.golfer = golfer;
        golfer.subscribe($scope.onGolferEvent);
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
     * update ball with new coords
     */
    $scope.updateBall = function() {
        if ($scope.ball) {
            $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
            $scope.ball.distanceToHole = geomath.calculateDistance($scope.currentHole.location, $scope.ball.coords);
            $scope.ball.inRange = ($scope.ball.distanceTo < 10) || $scope.debug;
            golfer.setInRange($scope.ball.inRange);

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