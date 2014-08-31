app.service('geotracker', function(pubnub) {
    var self = this;

    this.pubnub = pubnub;

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
     * @param optional config to override default
     *
     */
    this.start = function(config, devmode) {
        if (config) {
            self.config = config;
        }
        if (self.watchID) {
            navigator.geolocation.clearWatch(self.watchID);
        }

        if (devmode) {
            navigator.geolocation.getCurrentPosition(function(geo) {
                var dummygeo = { timestamp: geo.timestamp, coords: { latitude: geo.coords.latitude, longitude: geo.coords.longitude } };
                self.updated(dummygeo); });
        } else {
            self.watchID = navigator.geolocation.watchPosition(self.updated, self.error, self.config);
        }
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

        //if (pubnub.active) {
            self.pubnub.updateGeo(geo);
        //}
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