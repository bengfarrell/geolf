app.service('places', function($http, geotracker, geomath, mapping) {
    var self = this;

    /** list of places found */
    self.places = [];

    this.config = {
        providerName: "GooglePlaces"
    }

    /** c-tor */
    this.init = function() {
        geotracker.subscribe(self.updateDistances);
    }

    /**
     * places search
     * @param geo
     * @param callback
     */
    this.search = function(radius, callback, geo) {
        self.callback = callback;
        if (self.config.providerName == "GooglePlaces") {
            if (!geo) {
                geo = geotracker.geo;
            }
            var llb = new google.maps.LatLng(geo.coords.latitude, geo.coords.longitude);
            var service = new google.maps.places.PlacesService(mapping.map);
            service.nearbySearch({radius: radius, location: llb}, self._onPlacesFound);
        }
    };

    /**
     * get farthest
     */
    this.getClosest = function() {
        if (self.places.length == 0) { return null; }
        return self.places[0];
    }


    /**
     * get farthest
     */
    this.getFarthest = function() {
        if (self.places.length == 0) { return null; }
        return self.places[self.places.length-1];
    }

    /**
     * sort places by proximity to user
     */
    this.sortByProximity = function() {
        self.places = self.places.sort( function(a, b) {
            return a.distance - b.distance;
        });
    }

    /**
     * update distances in location list from origin
     */
    this.updateDistances = function() {
        if (!geotracker.geo || !self.places) {
            return;
        }
        self.places.forEach(function(loc) {
            loc.distance = geomath.calculateDistance(loc.location, geotracker.geo.coords);
        });
        self.sortByProximity();
    }

    /**
     * on places found callback
     * @param results
     * @private
     */
    this._onPlacesFound = function(results) {
        if (self.config.providerName == "GooglePlaces") {
            results.forEach( function(i) {
                var dest = {
                    location: { latitude: i.geometry.location.lb, longitude: i.geometry.location.mb },
                    name: i.name
                }
                self.places.push(dest);
            });
        }
        self.updateDistances();
        self.callback.apply(this, [self.places]);
    }

    this.init();
});