angular.module('geolfApp').service('places', function($http, geotracker, mapping) {
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
    this.search = function(radius, callback) {
        self.callback = callback;
        if (self.config.providerName == "GooglePlaces") {
            var llb = new google.maps.LatLng(geotracker.geo.coords.latitude, geotracker.geo.coords.longitude);
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
            var R = 6371000; // meters
            var dLat = self.toRad(loc.location.latitude - geotracker.geo.coords.latitude);
            var dLon = self.toRad(loc.location.longitude - geotracker.geo.coords.longitude);
            var lat1 = self.toRad(geotracker.geo.coords.latitude);
            var lat2 = self.toRad(loc.location.latitude);

            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            loc.distance = parseInt(R * c);
        });
        self.sortByProximity();
    }

    /**
     * math util to convert lat/long to radians
     * @param value
     * @returns {number}
     */
    this.toRad = function(value) {
        return value * Math.PI / 180;
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