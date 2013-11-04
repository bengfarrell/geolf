app.service('orientation', function() {
    var self = this;

    this.config = {
        frequency: 300
    };

    /** is orientation available ? */
    this.available = navigator.compass ? true : false;

    /** orientation listeners */
    this.listeners = [];

    /** heading */
    this.heading = { magneticHeading: 0 };

    /**
     * get one time orientation
     * @param callback
     */
    this.getCurrent = function(callback) {
        if (!self.available) { return false; }
        navigator.compass.getCurrentHeading(callback, self.error);
    }

    /**
     * start tracking
     * @param callback for orientation update
     * @param optional config to override default
     *
     */
    this.start = function(config) {
        if (!self.available) { return false; }
        if (config) {
            self.config = config;
        }
        self.watchID = navigator.compass.watchHeading(self.updated, self.error, self.config);
    };

    /**
     * stop watching orientation
     */
    this.stop = function() {
        if (self.watchID) {
            navigator.compass.clearWatch(self.watchID);
            self.watchID = null;
        }
    }

    /**
     * subscribe to orientation service
     * @param callback
     */
    this.subscribe = function(callback) {
        self.listeners.push(callback);
    }

    /**
     * update heading
     * @param heading
     */
    this.updated = function(heading) {
        self.heading = heading;
        self.listeners.forEach( function(l) {
            l.apply(this, [heading]);
        });
    }

    /**
     * update orientation error handler
     * @param error
     */
    this.error = function(error) {
        console.log("error");
    }
});