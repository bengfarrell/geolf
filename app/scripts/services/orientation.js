app.service('orientation', function() {
    var self = this;

    this.config = {
        frequency: 100
    };

    /** is device orientation available ? */
    this.available = window.DeviceOrientationEvent ? true : false;

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
        self.available = window.DeviceOrientationEvent ? true : false;
    }

    /**
     * get one time orientation
     * @param callback
     */
    this.getCurrent = function(callback) {
        if (!self.available) { return false; }
    }

    /**
     * start tracking
     * @param callback for orientation update
     * @param optional config to override default
     *
     */
    this.start = function(config) {
        if (!self.available) { return false; }
        self.config = config;
        window.addEventListener('deviceorientation', self.updated);
    };

    /**
     * stop watching orientation
     */
    this.stop = function() {
        if (!self.available) { return false; }
        window.removeEventListener('deviceorientation', self.updated);
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
     * update orientation
     * @param orientation
     */
    this.updated = function(o) {
        self.orientation = o;
        self.listeners.forEach( function(l) {
            l.apply(this, [o]);
        });
    }

    this.init();
});