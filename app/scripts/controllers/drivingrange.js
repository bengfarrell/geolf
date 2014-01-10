'use strict';
app.controller('DrivingRangeController', function ($scope, mapping, geotracker, orientation, acceleration, compass) {

    /** max swing time - 2 seconds produces no distance/power */
    $scope.maxSwingTime = 2000;

    /** swing tracker object */
    $scope.trackSwing = { isSwinging: false, inPosition: false, startTime: 0, coords: {x:0,y:0,z:0} };

    /**
     * init controller
     */
    $scope.init = function() {
        geotracker.getCurrent( function(geo) {
            mapping.create("map-canvas", geo);
            $scope.player = mapping.addMarker('player', 'player', geo.coords);
            $scope.ball = mapping.addMarker('ball', 'ball', geo.coords);

            compass.subscribe(function(heading) {
                if ($scope.player) {
                    var ico = $scope.player.marker.getIcon();
                    ico.rotation = heading.magneticHeading;
                    $scope.player.marker.setIcon(ico);
                }
            });

            if (compass.available) {
                compass.start();
            }

            orientation.subscribe(function(o) {
                if (o.beta < -75 && !$scope.trackSwing.inPosition) {
                    $scope.onReadySwing(geo);
                } else if (o.beta > -60 && $scope.trackSwing.inPosition) {
                    $scope.onStartSwing();
                } else if (o.beta > 50 && $scope.trackSwing.isSwinging) {
                    $scope.onStopSwing();
                } else if ($scope.trackSwing.isSwinging) {
                    $scope.trackSwing.wobble.accumulated += o.gamma;
                    $scope.trackSwing.wobble.samples ++;
                    $scope.trackSwing.wobble.average = $scope.trackSwing.wobble.accumulated / $scope.trackSwing.wobble.samples;
                }
            });

            if (orientation.available) {
                orientation.start();
            }

            acceleration.subscribe(function(a) {
                if ($scope.trackSwing.isSwinging) {
                    $scope.trackSwing.acceleration.accumulated += a.y;
                    $scope.trackSwing.acceleration.samples ++;
                    $scope.trackSwing.acceleration.average = $scope.trackSwing.acceleration.accumulated / $scope.trackSwing.acceleration.samples;
                }
            });

            if (acceleration.available) {
                acceleration.start();
            }
        });
    }

    /**
     * on ready swing
     * @param current geo location
     */
    $scope.onReadySwing = function(geo) {
        mapping.moveMarkerTo($scope.ball, geo.coords);
        $scope.trackSwing.isSwinging = false;
        $scope.trackSwing.inPosition = true;
        $scope.trackSwing.wobble = { accumulated: 0, samples: 0, average: 0 };
        $scope.trackSwing.acceleration = { accumulated: 0, samples: 0, average: 0 };
        navigator.notification.vibrate(100);
    }

    /**
     * on start swing
     */
    $scope.onStartSwing = function() {
        $scope.trackSwing.isSwinging = true;
        $scope.trackSwing.inPosition = false;
        $scope.trackSwing.startTime = new Date().getTime();
    }

    /**
     * on stop swing
     */
    $scope.onStopSwing = function() {
        $scope.trackSwing.endTime = new Date().getTime();
        var ttltime = $scope.trackSwing.endTime - $scope.trackSwing.startTime;
        var acc = Math.abs($scope.trackSwing.acceleration.average);
        var power = ($scope.maxSwingTime - ttltime) * acc;

        console.log($scope.trackSwing.acceleration.samples)
        console.log("Acc: " + acceleration + " Power: " + power + " time: " + ($scope.maxSwingTime - ttltime))
        if (power < 0 ) { power = 0; }
        $scope.trackSwing.distance = Math.floor(power/100);
        $scope.trackSwing.isSwinging = false;
        $scope.trackSwing.inPosition = false;

        $scope.hit($scope.trackSwing.distance);
        navigator.notification.vibrate(1000);
    }

    /**
     * hit the ball
     * @param power
     * @param direction
     */
    $scope.hit = function(power, direction) {
        $scope.$apply();
        mapping.animateMarkerBy(
            $scope.ball, power, compass.heading.magneticHeading -270, {animation: 'arc'}, function() {
            });
    }

    $scope.init();
});