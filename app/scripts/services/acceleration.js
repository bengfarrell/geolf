app.service('acceleration', function() {
    var self = this;

    this.config = {
        frequency: 1000
    };

    /** is accelerometer available ? */
    this.available = navigator.accelerometer ? true : false;

    /** orientation listeners */
    this.listeners = [];

    /** acceleration */
    this.acceleration = {};

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
        self.available = navigator.accelerometer ? true : false;
    }

    /**
     * get one time orientation
     * @param callback
     */
    this.getCurrent = function(callback) {
        if (!self.available) { return false; }
        navigator.accelerometer.getCurrentAcceleration(callback, self.error);
    }

    /**
     * start tracking
     * @param callback for orientation update
     * @param optional config to override default
     *
     */
    this.start = function(config) {

        if (!self.available) { return false; }
        if (config) { self.config = config; }
        self.accelerationWatch = navigator.accelerometer.watchAcceleration(
            self.updated, function(ex) {
                console.log("accel fail (" + ex.name + ": " + ex.message + ")");
            }, {frequency: 250});
    };

    /**
     * stop watching orientation
     */
    this.stop = function() {
        if (!self.available) { return false; }
        navigator.accelerometer.clearWatch(self.accelerationWatch);
        self.accelerationWatch = null;
    }

    /**
     * subscribe to orientation service
     * @param callback
     */
    this.subscribe = function(callback) {
        self.listeners.push(callback);
    }

    /**
     * remove all the listeners
     */
    this.removeAllListeners = function() {
        self.listeners = [];
    }

    /**
     * update acceleration
     * @param acceleration
     */
    this.updated = function(a) {
        self.acceleration = a;
        self.listeners.forEach( function(l) {
            l.apply(this, [a]);
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