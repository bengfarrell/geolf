app.service('keyboard', function() {
    var self = this;

    /** orientation listeners */
    this.listeners = [];

    /**
     * c-tor
     */
    this.init = function() {
        document.addEventListener("keypress", self.onKeyPress, false);
        document.addEventListener("keyup", self.onKeyUp, false);
        document.addEventListener("keydown", self.onKeyDown, false);
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
     * on keypress
     * @param keyevent
     */
    this.onKeyPress = function(keyevent) {
        self.listeners.forEach( function(l) {
            l.apply(this, ["keypress", String.fromCharCode(keyevent.keyCode).toUpperCase(), keyevent]);
        });
    }

    /**
     * on keyup
     * @param keyevent
     */
    this.onKeyUp = function(keyevent) {
        self.listeners.forEach( function(l) {
            l.apply(this, ["keyup", String.fromCharCode(keyevent.keyCode).toUpperCase(), keyevent]);
        });
    }

    /**
     * on keydown
     * @param keyevent
     */
    this.onKeyDown = function(keyevent) {
        self.listeners.forEach( function(l) {
            l.apply(this, ["keydown", String.fromCharCode(keyevent.keyCode).toUpperCase(), keyevent]);
        });
    }
    this.init();
});
