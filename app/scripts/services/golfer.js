app.service('golfer', function(mapping, geotracker, orientation, acceleration, compass) {
    var self = this;

    self.listeners = [];

    /** max swing time - 2 seconds produces no distance/power */
    self.maxSwingTime = 2000;

    /** boolean if golfer is in range of, and able to hit ball */
    self.inRange = false;

    /** swing tracker object */
    self.trackSwing = { isSwinging: false, inPosition: false, startTime: 0, coords: {x:0,y:0,z:0} };

    /** club being used */
    self.club = 'driver';

    /** club property lookup */
    self._clubs = {
        driver: { power: 1, accuracy: .1 },
        wood: { power: .75,  accuracy: .4 },
        iron: { power:.5, accuracy: .6 },
        wedge: { power: .3, accuracy: .9},
        putter: { power: .1, accuracy: 1 }
    }

    /**
     * start golfer service
     */
    self.start = function() {
        compass.subscribe(function(heading) {
            self.currentDirection = heading.magneticHeading -270;
            self.listeners.forEach( function(l) {
                l.apply(this, ["compassUpdate", {heading: heading.magneticHeading -270}]);
            });
        });

        if (compass.available) {
            compass.start();
        }

        orientation.subscribe(function(o) {
            // exit method if golfer is not in range of ball
            if (!self.inRange && self.club != "putter") {
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
     * stop service
     */
    self.stop = function() {
        compass.stop();
        compass.removeAllListeners();
        orientation.stop();
        orientation.removeAllListeners();
        acceleration.stop();
        acceleration.removeAllListeners();
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
        if (inRange != self.inRange) {
            self.inRange = inRange;
            self.trackSwing = { isSwinging: false, inPosition: false, startTime: 0, coords: {x:0,y:0,z:0} };
        }
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
        self.trackSwing.endTime = new Date().getTime();
        var ttltime = self.trackSwing.endTime - self.trackSwing.startTime;
        self.trackSwing.isSwinging = false;
        self.trackSwing.inPosition = false;

        navigator.notification.vibrate(1000);

        var hit = {
            duration: ttltime,
            acceleration: parseInt(self.trackSwing.acceleration.average),
            power: parseInt(((self.maxSwingTime - ttltime) * Math.abs(self.trackSwing.acceleration.average) * self._clubs[self.club].power)/100),
            wobble: parseInt(self.trackSwing.wobble.average * (1 - self._clubs[self.club].accuracy)),
            direction: parseInt(self.currentDirection + self.trackSwing.wobble.average * (1 - self._clubs[self.club].accuracy)),
            facing: parseInt(self.currentDirection),
            club: self.club
        }

        self.listeners.forEach( function(l) {
            l.apply(this, ["swingComplete", hit]);
        });
    }
});
