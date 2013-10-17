'use strict';

angular.module('geolfApp')
  .controller('MainCtrl', function ($scope, geotracker, places, mapping) {
    $scope.placesService = places;

    $scope.init = function() {
        geotracker.start();
    }

    $scope.initializeGreen = function() {
        mapping.create();
        mapping.addMarker("me", "me", geotracker.geo.coords);
        places.search(500, $scope.onPlaces);
    }

    $scope.onPlaces = function() {
        var hole = places.getFarthest();
        mapping.addMarker("loc", hole.name, hole.location);
        $scope.$apply();
    }

    $scope.init();
  });