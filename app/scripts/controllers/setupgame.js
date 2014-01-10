'use strict';
app.controller('SetupGameController', function ($scope, $location, geotracker, places, mapping, state, compass) {
    /**
     * constructor
     */
    $scope.init = function() {
        $scope.state = state;
        state.setState($scope, "Loading");
        geotracker.getCurrent(function(geo) {
            mapping.create("map-canvas", geo);
            places.search(500, $scope.onPlaces, geo);
        });
    }

    /**
     * start game
     * @param debugMode
     */
    $scope.startGame = function(debugMode) {
        if (debugMode) {
            $scope.$parent.debug = true;
        } else {
            $scope.$parent.debug = false;
        }
        $location.url('/game');
    }


    /**
     * on place retrieval
     */
    $scope.onPlaces = function() {
        $scope.previewHoleIndex = 0;
        mapping.animateCameraTo(places.places[$scope.previewHoleIndex].location);
        $scope.previewMarker = mapping.addMarker("fdefault", "marker", places.places[$scope.previewHoleIndex].location)
        state.setState($scope, "Loaded");
        $scope.$parent.holes = places.places.slice();
        $scope.$parent.holes.reverse();
        $scope._refreshMarkers();
        $scope.$apply();
    }

    /**
     * jump to and preview next hole
     */
    $scope.previewNextHole = function() {
        $scope.previewHoleIndex ++;
        if ($scope.previewHoleIndex >= $scope.$parent.holes.length) {
            $scope.previewHoleIndex = 0;
        }
        $scope.currentHole = $scope.$parent.holes[$scope.previewHoleIndex];
        mapping.animateCameraTo($scope.$parent.holes[$scope.previewHoleIndex].location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.$parent.holes[$scope.previewHoleIndex].location);
    }

    /**
     * jump to and preview last hole
     */
    $scope.previewLastHole = function() {
        $scope.previewHoleIndex --;
        if ($scope.previewHoleIndex < 0) {
            $scope.previewHoleIndex = $scope.holes.length-1;
        }
        $scope.currentHole = $scope.$parent.holes[$scope.previewHoleIndex];
        mapping.animateCameraTo($scope.$parent.holes[$scope.previewHoleIndex].location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.$parent.holes[$scope.previewHoleIndex].location);
    }

    /**
     * delete currently previewing hole
     */
    $scope.deleteHole = function(index) {
        if (!index) {
            index = $scope.previewHoleIndex;
        }
        mapping.removeMarker($scope.$parent.holes[index].marker);
        $scope.$parent.holes.splice(index, 1);
        $scope.currentHole = $scope.$parent.holes[index];
        mapping.animateCameraTo($scope.$parent.holes[index].location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.$parent.holes[index].location);
        $scope.$apply();
    }

    /**
     * create a quick course
     * @param numHoles
     */
    $scope.quickCourse = function(numHoles) {
        // reset holes from places data
        $scope.$parent.holes = places.places.slice();
        while ($scope.$parent.holes.length > numHoles) {
            var hle = $scope.$parent.holes.pop();
            mapping.removeMarker(hle.marker);
        }
        $scope._refreshMarkers();
        $scope.previewHoleIndex = 0;
        $scope.currentHole = $scope.$parent.holes[$scope.previewHoleIndex];
        mapping.animateCameraTo($scope.$parent.holes[$scope.previewHoleIndex].location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.$parent.holes[$scope.previewHoleIndex].location);
    }

    /**
     * redraw/refresh all markers
     * @private
     */
    $scope._refreshMarkers = function() {
        for (var c = 0; c < $scope.$parent.holes.length; c++) {
            $scope.$parent.holes[c].num = c +1;
            var mrkr = mapping.addMarker("dot", "marker", $scope.$parent.holes[c].location);
            $scope.$parent.holes[c].marker = mrkr;
        }

    }

    $scope.init();
});