'use strict';
app.controller('DrivingRangeController', function ($scope, mapping, geotracker, orientation) {

    /** max swing time - 2 seconds produces no distance/power */
    $scope.maxSwingTime = 2000;

    /** swing tracker object */
    $scope.trackSwing = { isSwinging: false, startTime: 0, coords: {x:0,y:0} };

    /**
     * init controller
     */
    $scope.init = function() {
        geotracker.getCurrent( function(geo) {
            mapping.create("map-canvas", geo);
            $scope.player = mapping.addMarker('player', 'player', geo.coords);

            orientation.subscribe(function(heading) {
                if ($scope.player) {
                    var ico = $scope.player.marker.getIcon();
                    ico.rotation = heading.magneticHeading;
                    $scope.player.marker.setIcon(ico);
                }
            })

            if (orientation.available) {
                orientation.start();
            }
        });
    }

    /**
     * on start swing
     */
    $scope.onStartSwing = function(event) {
        $scope.trackSwing.isSwinging = true;
        $scope.trackSwing.startTime = new Date().getTime();
        $scope.trackSwing.coords.x = event.x;
        $scope.trackSwing.coords.y = event.y;
        $scope.trackSwing.wobble = { accumulated: 0, samples: 0, average: 0 }
    }

    /**
     * on swinging
     * @param event
     */
    $scope.onSwinging = function(event) {
        if ($scope.trackSwing.isSwinging) {
            $scope.trackSwing.wobble.accumulated += $scope.trackSwing.coords.x - event.x;
            $scope.trackSwing.wobble.samples ++;
            $scope.trackSwing.wobble.average = $scope.trackSwing.wobble.accumulated / $scope.trackSwing.wobble.samples;
        }
    }

    /**
     * on stop swing
     */
    $scope.onStopSwing = function(event) {
        $scope.trackSwing.endTime = new Date().getTime();
        var ttltime = $scope.trackSwing.endTime - $scope.trackSwing.startTime;
        var ttldist = Math.abs($scope.trackSwing.coords.y - event.y);
        var power = $scope.maxSwingTime - ttltime;
        if (power < 0 ) { power = 0; }
        power *= ttldist;
        $scope.trackSwing.distance = Math.floor(power/1000);
        $scope.trackSwing.isSwinging = false;
    }

    $scope.init();
});