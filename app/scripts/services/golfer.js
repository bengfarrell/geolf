app.service('golfer', function(mapping, geotracker, orientation, acceleration, compass) {
    var self = this;

    self.listeners = [];

    /** max swing time - 2 seconds produces no distance/power */
    self.maxSwingTime = 2000;

    /** boolean if golfer is in range of, and able to hit ball */
    self.inRange = false;

    /** swing tracker object */
    self.trackSwing = { isSwinging: false, inPosition: false, startTime: 0, coords: {x:0,y:0,z:0} };

    /**
     * initialize
     */
    self.init = function() {
        compass.subscribe(function(heading) {
            self.listeners.forEach( function(l) {
                l.apply(this, ["compassUpdate", {heading: heading.magneticHeading}]);
            });
        });

        if (compass.available) {
            compass.start();
        }

        orientation.subscribe(function(o) {
            // exit method if golfer is not in range of ball
            if (!self.inRange) {
                return;
            }
            if (o.beta < -75 && !self.trackSwing.inPosition) {
                self.onReadySwing();
            } else if (o.beta > -60 && self.trackSwing.inPosition) {
                self.onStartSwing();
            } else if (o.beta > 50 && self.trackSwing.isSwinging) {
                self.onStopSwing();
            } else if (self.trackSwing.isSwinging) {
                self.trackSwing.wobble.accumulated += o.gamma;
                self.trackSwing.wobble.samples ++;
                self.trackSwing.wobble.average = self.trackSwing.wobble.accumulated / self.trackSwing.wobble.samples;
            }
        });

        if (orientation.available) {
            orientation.start();
        }

        acceleration.subscribe(function(a) {
            if (self.trackSwing.isSwinging) {
                self.trackSwing.acceleration.accumulated += a.y;
                self.trackSwing.acceleration.samples ++;
                self.trackSwing.acceleration.average = self.trackSwing.acceleration.accumulated / self.trackSwing.acceleration.samples;
            }
        });

        if (acceleration.available) {
            acceleration.start();
        }
    }

    /**
     * subscribe to service
     * @param callback
     */
    self.subscribe = function(callback) {
        self.listeners.push(callback);
    }

    /**
     * set whether the player is in range to hit the ball
     * @param is in range (boolean)
     */
    self.setInRange = function(inRange) {
        self.inRange = inRange;
        self.trackSwing = { isSwinging: false, inPosition: false, startTime: 0, coords: {x:0,y:0,z:0} };
    }

    /**
     * on ready swing
     */
    self.onReadySwing = function() {
        self.listeners.forEach( function(l) {
            l.apply(this, ["inPosition"]);
        });
        self.trackSwing.isSwinging = false;
        self.trackSwing.inPosition = true;
        self.trackSwing.wobble = { accumulated: 0, samples: 0, average: 0 };
        self.trackSwing.acceleration = { accumulated: 0, samples: 0, average: 0 };
        navigator.notification.vibrate(100);
    }

    /**
     * on start swing
     */
    self.onStartSwing = function() {
        self.listeners.forEach( function(l) {
            l.apply(this, ["swingStart"]);
        });
        self.trackSwing.isSwinging = true;
        self.trackSwing.inPosition = false;
        self.trackSwing.startTime = new Date().getTime();
    }

    /**
     * on stop swing
     */
    self.onStopSwing = function() {
        console.log("stop swing");
        self.trackSwing.endTime = new Date().getTime();
        var ttltime = self.trackSwing.endTime - self.trackSwing.startTime;
        var acc = Math.abs(self.trackSwing.acceleration.average);
        var power = (self.maxSwingTime - ttltime) * acc;

        console.log(self.trackSwing.acceleration.samples)
        console.log("Acc: " + acceleration + " Power: " + power + " time: " + (self.maxSwingTime - ttltime))
        if (power < 0 ) { power = 0; }
        self.trackSwing.distance = Math.floor(power/100);
        self.trackSwing.isSwinging = false;
        self.trackSwing.inPosition = false;

        navigator.notification.vibrate(1000);
        self.listeners.forEach( function(l) {
            l.apply(this, ["swingComplete", {distance: self.trackSwing.distance, wobble: self.trackSwing.wobble.average}]);
        });
    }
});
