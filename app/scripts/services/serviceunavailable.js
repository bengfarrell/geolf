app.service('serviceunavailable', function(geotracker, mapping) {
    var self = this;

    self.init = function() {
        geotracker.subscribe(self.onError);
    }

    self.onError = function(err) {
        console.log(err)
    }

    self.init();
});