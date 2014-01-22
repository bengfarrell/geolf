'use strict';
app.controller('SetupGameController', function ($scope, $location, geotracker, course, mapping, state) {
    /**
     * constructor
     */
    $scope.init = function() {
        state.attachController($scope);
        $scope.course = course;
        state.setState($scope, "Loading");
        geotracker.getCurrent(function(geo) {
            mapping.create("map-canvas", geo);
            course.load(geo, $scope.onCourseLoaded);
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
     * on course loaded
     */
    $scope.onCourseLoaded = function() {
        $scope.previewHoleIndex = 0;
        $scope.currentHole = course.getHoleAtIndex($scope.previewHoleIndex);

        mapping.animateCameraTo($scope.currentHole.location);
        $scope.previewMarker = mapping.addMarker("default", "marker", $scope.currentHole.location);

        for (var c in course.holes) {
            course.holes[c].marker = mapping.addMarker("dot", "marker", course.holes[c].location);
        }
        state.setState($scope, "Loaded");
        $scope.$apply();
    }

    /**
     * jump to and preview next hole
     */
    $scope.previewNextHole = function() {
        $scope.previewHoleIndex ++;
        if ($scope.previewHoleIndex >= course.holes.length) {
            $scope.previewHoleIndex = 0;
        }
        $scope.currentHole = course.getHoleAtIndex($scope.previewHoleIndex);
        mapping.animateCameraTo($scope.currentHole.location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.currentHole.location);
    }

    /**
     * jump to and preview last hole
     */
    $scope.previewLastHole = function() {
        $scope.previewHoleIndex --;
        if ($scope.previewHoleIndex < 0) {
            $scope.previewHoleIndex = course.holes.length-1;
        }
        $scope.currentHole = course.getHoleAtIndex($scope.previewHoleIndex);
        mapping.animateCameraTo($scope.currentHole.location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.currentHole.location);
    }

    /**
     * delete currently previewing hole
     */
    $scope.deleteHole = function(index) {
        if (!index) {
            index = $scope.previewHoleIndex;
        }
        var hole = course.getHoleAtIndex(index);
        mapping.removeMarker(hole.marker);
        course.removeHole(hole);

        $scope.currentHole = course.getHoleAtIndex($scope.previewHoleIndex);
        mapping.animateCameraTo($scope.currentHole.location);
        mapping.moveMarkerTo($scope.previewMarker, $scope.currentHole.location);
    }

    /**
     * create a quick course
     * @param numHoles
     */
    $scope.quickCourse = function(numHoles) {
        // remove all markers
        for (var c = 0; c < course.holes.length; c++) {
            mapping.removeMarker(course.getHoleAtIndex(c).marker);
        }

        course.generateCourse(numHoles);
        $scope._refreshMarkers();
        $scope.previewHoleIndex = 0;
        mapping.animateCameraTo(course.getHoleAtIndex($scope.previewHoleIndex).location);
        mapping.moveMarkerTo($scope.previewMarker, course.getHoleAtIndex($scope.previewHoleIndex).location);
    }

    /**
     * redraw/refresh all markers
     * @private
     */
    $scope._refreshMarkers = function() {
        for (var c = 0; c < course.holes.length; c++) {
            var mrkr = mapping.addMarker("dot", "marker", course.getHoleAtIndex(c).location);
            course.getHoleAtIndex(c).marker = mrkr;
        }
    }

    $scope.init();
});