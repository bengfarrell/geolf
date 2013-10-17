'use strict';

angular.module('geolfApp')
  .controller('MainCtrl', function ($scope, geotracker, geomath, places, mapping) {
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
            mapping.addMarker("me", "me", geotracker.geo.coords);
            places.search(500, $scope.onPlaces);
        }

        /**
         * swing golf club
         */
        $scope.swing = function(power, angle) {
            var coords = geomath.projectOut(geotracker.geo.coords, 500, 29);
            mapping.addMarker("ball", "ball", coords);
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