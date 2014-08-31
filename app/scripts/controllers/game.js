'use strict';
app.controller('GameController', function ($scope, $location, compass, geotracker, geomath, mapping, state, golfer, course, pubnub, keyboard) {

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

        //if ($routeParams.mode == ":war") {
            $scope.initMultiplayer();
        //}

        keyboard.subscribe(function(eventtype, key, event) {
            // fake a swing using the b key
            if (eventtype == "keypress" && key == "B" ) {
                $scope.onGolferEvent("swingComplete", { power: 450, direction: Math.random()*360 } );
            }

            // keyboard control over our location for debugging
            var x = 0;
            var y = 0;
            if (event.keyCode == 37) { y -= 0.0002; }
            if (event.keyCode == 39) { y += 0.0002; }

            if (event.keyCode == 38) { x -= 0.0002; }
            if (event.keyCode == 40) { x += 0.0002; }

            if (eventtype == "keydown") {
                geotracker.geo.coords.latitude += x;
                geotracker.geo.coords.longitude += y;

                pubnub.updateGeo(geotracker.geo);
                mapping.moveMarkerTo($scope.player, geotracker.geo.coords);
                $scope.$apply();
            }
        });

        geotracker.subscribe(function(geo) {
            if (!$scope.initialized) {
                $scope.initializeGreen(geo);
            }
            $scope.updateBall();
            $scope.updateHole();

            mapping.moveMarkerTo($scope.player, geo.coords);
            $scope.$apply();
        });
        geotracker.start({}, true);
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

                pubnub.updateBall({coords: $scope.ball.coords, state: "hit", power: params.power, direction: params.direction, path: path } );
                mapping.animateMarkerBy(
                    $scope.ball, params.power, params.direction, {animation: path}, function() {
                        $scope.updateBall();
                       // pubnub.updateBall( { coords: $scope.ball.coords, state: "inplay" } );
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
        $scope.currentHole = course.getCurrentHole();

        if ($scope.currentHole && $scope.currentHole.ballLocation) {
            $scope.ball = mapping.addMarker('ball', 'ball', $scope.currentHole.ballLocation);
        } else {
            $scope.ball = mapping.addMarker('ball', 'ball', geo.coords);
        }

        golfer.start();
        $scope.golfer = golfer;
        golfer.subscribe($scope.onGolferEvent);
        state.setState($scope, 'GamePlay.BeforeTeeOff.mapAvailable');

        $scope.currentHole.marker = mapping.addMarker('loc', $scope.currentHole.name, $scope.currentHole.location);
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
            $scope.currentHole.ballLocation = $scope.ball.coords;
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

    $scope.initMultiplayer = function() {
        pubnub.start();
        pubnub.subscribe("geo", function (m) {
            if (!$scope.initialized) { return; }

            for (var c in m.players) {
                if (m.players[c].active && !m.players[c].marker && m.players[c].geo) {
                    // add a marker, the player is new and has geo coords
                    m.players[c].marker = mapping.addMarker("dot", m.players[c], m.players[c].geo.coords);
                } else if (!m.players[c].active && m.players[c].marker) {
                    // remove a marker, the player is no longer active
                    mapping.removeMarker(m.players[c].marker);
                    m.players[c].marker = null;
                } else if (m.players[c].active && m.players[c].marker) {
                    // move the already existing marker
                    mapping.moveMarkerTo(m.players[c].marker, m.players[c].geo.coords);
                }
            }
        });

        pubnub.subscribe("ball", function (m) {
            console.log($scope.fired)
            if (!$scope.initialized) { return; }
            if (m.state == "inplay") { return; }
            //if ($scope.fired) { console.log("blocked already fired"); return; }

            if (!$scope.ball) {
                $scope.ball = mapping.addMarker('ball', 'ball');
                $scope.updateBall();
            }

            course.getCurrentHole().stroke += 3; // penalty +2 for not hitting the ball yourself!
            course.refreshScore();
            state.setState($scope, 'Animating.mapAvailable');
            $scope.$apply();

           // $scope.fired = true;
            mapping.animateMarkerBy(
                $scope.ball, m.power, m.direction, {animation: m.path}, function() {
                    $scope.updateBall();
                    state.setState($scope, 'GamePlay.AfterTeeOff.mapAvailable');
                    $scope.$apply();
                });

        });


        pubnub.subscribe("players", function (m) {
           // $scope.playerCount = m.playerCount;
           // $scope.$apply();
        });
    }

    /** call c-tor */
    $scope.init();
  });