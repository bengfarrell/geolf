app.service('orientation', function() {
    var self = this;

    this.config = {
        frequency: 100
    };

    /** is orientation available ? */
    this.available = navigator.compass ? true : false;

    /** orientation listeners */
    this.listeners = [];

    /** heading */
    this.heading = { magneticHeading: 0 };

    /**
     * c-tor
     */
    this.init = function() {
        document.addEventListener("deviceready", self.onDeviceReady, false)
    }

    /**
     * phonegap device ready listener
     */
    this.onDeviceReady = function() {
        self.available = navigator.compass ? true : false;
    }

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
     * manual refresh for outside mechanisms updating the heading object
     */
    this.forceRefresh = function() {
        this.updated(self.heading);
    }

    /**
     * update orientation error handler
     * @param error
     */
    this.error = function(error) {
        console.log("error");
    }

    this.init();
});