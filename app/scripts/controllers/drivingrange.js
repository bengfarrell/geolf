'use strict';
app.controller('DrivingRangeController', function ($scope, mapping, geotracker, golfer) {
    /**
     * init controller
     */
    $scope.init = function() {
        geotracker.getCurrent( function(geo) {
            mapping.create("map-canvas", geo);
            $scope.player = mapping.addMarker('player', 'player', geo.coords);
            $scope.ball = mapping.addMarker('ball', 'ball', geo.coords);
            $scope.golfer = golfer;

            golfer.init();
            golfer.setInRange(true);
            golfer.subscribe($scope.onGolferEvent);

            $scope.$apply();
        });
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
                // reset position for driving range
                mapping.moveMarkerTo($scope.ball, $scope.player.coords);
                break;

            case "swingComplete":
                $scope.swingDetails = params;
                $scope.$apply();
                mapping.animateMarkerBy(
                    $scope.ball, params.distance, $scope.heading -270, {animation: 'arc'}, function() {
                    });
                break;
        }
    }

    $scope.init();
});