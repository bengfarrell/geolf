'use strict';
app.controller('GameController', function ($scope, $location, compass, geotracker, geomath, mapping, state, golfer, course) {

    /**
     * init controller
     */
    $scope.init = function() {
        $scope.$on('$destroy', function () {
            $scope.initialized = false;
            geotracker.stop();
            golfer.stop();
        });

        state.attachController($scope);
        if (mapping.available) { state.setState($scope, 'GamePlay.mapAvailable'); }
        else { state.setState($scope, 'GamePlay.mapUnavailable');  }

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
                course.getCurrentHole().stroke ++;
                course.refreshScore();
                $scope.swingDetails = params;
                state.setState($scope, 'Animating.mapAvailable');
                $scope.$apply();

                var path = 'arc';
                if (params.club == 'putter') {
                    path = 'straight';
                }
                mapping.animateMarkerBy(
                    $scope.ball, params.power, params.direction, {animation: path}, function() {
                        $scope.updateBall();
                        state.setState($scope, 'GamePlay.AfterTeeOff.mapAvailable');
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
        state.setState($scope, 'GamePlay.BeforeTeeOff.mapAvailable');

        course.getCurrentHole().marker = mapping.addMarker('loc', course.getCurrentHole().name, course.getCurrentHole().location);

        $scope.currentHole = course.getCurrentHole();
        $scope.$apply();
    }

    /**
     * send camera to find ball
     */
    $scope.locateBall = function() {
        state.setState($scope, 'Animating.mapAvailable');
        mapping.animateCameraTo($scope.ball.coords, {animation: 'arc', returnToOriginal: true}, function() {
            state.undoState();
            $scope.$apply();
        });
    }

    /**
     * send camera to find hole
     */
    $scope.locateHole = function() {
        state.setState($scope, 'Animating.mapAvailable');
        mapping.animateCameraTo(course.getCurrentHole().location, {animation: 'arc', returnToOriginal: true}, function() {
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
            $scope.ball.distanceToHole = geomath.calculateDistance(course.getCurrentHole().location, $scope.ball.coords);
            $scope.ball.inRange = ($scope.ball.distanceTo < 10) || $scope.debug;
            golfer.setInRange($scope.ball.inRange);

            if ($scope.ball.distanceToHole < 50) {
                $scope.currentHole = course.getNextHole();
                mapping.moveMarkerTo(course.getCurrentHole().marker, course.getCurrentHole().location);
                $scope.updateBall();
                $scope.updateHole();
                $scope.gotoView('scorecard');
            }
        }
    }

    /**
     * update hole with new coords
     */
    $scope.updateHole = function() {
        if (course.getCurrentHole()) {
            course.getCurrentHole().bearingTo = geomath.calculateBearing(geotracker.geo.coords, course.getCurrentHole().location) -180;
            course.getCurrentHole().distanceTo = geomath.calculateDistance(geotracker.geo.coords, course.getCurrentHole().location);
        }
    }

    /** call c-tor */
    $scope.init();
  });