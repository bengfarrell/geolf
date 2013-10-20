'use strict';
app.controller('MainCtrl', function ($scope, geotracker, places, mapping) {
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

        /**
         * swing golf club
         */
        $scope.swing = function() {
            if (!$scope.ball) {
                $scope.ball = mapping.addMarker("ball", "ball");
            }
            mapping.moveMarkerBy($scope.ball, $scope.power, $scope.direction);
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