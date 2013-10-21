'use strict';
app.controller('MainCtrl', function ($scope, geotracker, geomath, places, mapping) {
        $scope.state = "Initializing";

        /**
         * constructor
         */
        $scope.init = function() {
            geotracker.start();
        }

        /**
         * initialize golf green around user's location
         */
        $scope.initializeGreen = function() {
            $scope.state = "Initializing";
            mapping.create();
            mapping.addMarker("me", "me");
            places.search(500, $scope.onPlaces);
        }

        $scope.findBall = function() {
            mapping.animateCameraTo($scope.ball.coords, {animation: "arc", returnToOriginal: true}, function() {
                console.log("done")
            });
        }

        /**
         * swing golf club
         */
        $scope.swing = function() {
            if (!$scope.ball) {
                $scope.ball = mapping.addMarker("ball", "ball");
            }

            $scope.state = "animating";
            mapping.animateMarkerBy(
                $scope.ball, $scope.power,
                $scope.direction, {animation: "arc"}, function() {
                    $scope.state = "GamePlay";
                    $scope.ball.distanceTo = geomath.calculateDistance(geotracker.geo.coords, $scope.ball.coords);
                    $scope.ball.bearingTo = geomath.calculateBearing(geotracker.geo.coords, $scope.ball.coords) -90;
                    $scope.$apply();
                });
        }

        /**
         * on place retrieval
         */
        $scope.onPlaces = function() {
            $scope.state = "GamePlay";
            var hole = places.getFarthest();
            mapping.addMarker("loc", hole.name, hole.location);
            $scope.$apply();
        }

        /** call c-tor */
        $scope.init();
  });