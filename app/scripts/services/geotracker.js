app.service('geotracker', function() {
    var self = this;

    this.config = {
        enableHighAccuracy: true,
        maximumAge: 5000
    };

    /** geo listeners */
    this.listeners = [];

    /**
     * get one time geolocation
     * @param callback
     */
    this.getCurrent = function(callback) {
        navigator.geolocation.getCurrentPosition(callback, self.error, self.config);
    }

    /**
     * start tracking
     * @param callback for geoservice update
     * @param optional config to override default
     *
     */
    this.start = function(config) {
        if (config) {
            self.config = config;
        }
        if (self.watchID) {
            navigator.geolocation.clearWatch(self.watchID);
        }
        self.watchID = navigator.geolocation.watchPosition(self.updated, self.error, self.config);
    };

    /**
     * stop tracking
     */
    this.stop = function() {
        if (self.watchID) {
            navigator.geolocation.clearWatch(self.watchID);
        }
    }

    /**
     * subscribe to geo service
     * @param callback
     */
    this.subscribe = function(callback) {
        self.listeners.push(callback);
    }

    /**
     * update geolocation
     * @param geo
     */
    this.updated = function(geo) {
        self.accuracy = geo.coords.accuracy;
        self.geo = geo;
        self.listeners.forEach( function(l) {
            l.apply(this, [geo]);
        });
    }

    /**
     * update geolocation error handler
     * @param error
     */
    this.error = function(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                self.listeners.forEach( function(l) {
                    l.apply(this, [{error: true, message: "User denied the request for Geolocation."}]);
                });
                break;
            case error.POSITION_UNAVAILABLE:
                self.listeners.forEach( function(l) {
                    l.apply(this, [{error: true, message: "Location information is unavailable."}]);
                });
                break;
            case error.TIMEOUT:
                self.listeners.forEach( function(l) {
                    l.apply(this, [{error: true, message: "The request to get user location timed out."}]);
                });
                break;
            case error.UNKNOWN_ERROR:
                self.listeners.forEach( function(l) {
                    l.apply(this, [{error: true, message: "An unknown error occurred."}]);
                });
                break;
        }
    }
});