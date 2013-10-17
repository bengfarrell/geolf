angular.module('geolfApp').service('geomath', function() {
    var self = this;
    var R = 6371000; // earth's radius in meters

    /**
     * calculate distance
     * @param geo1
     * @param geo2
     * @returns {Number}
     */
    this.calculateDistance = function(geo1, geo2) {
        var dLat = self.toRad(geo1.latitude - geo2.latitude);
        var dLon = self.toRad(geo1.longitude - geo2.longitude);
        var lat1 = self.toRad(geo2.latitude);
        var lat2 = self.toRad(geo1.latitude);

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return parseInt(R * c);
    }

    /**
     * get coords from projecting out from location at a certain distance and angle
     * @param geo
     * @param distance
     * @param bearing
     */
    this.projectOut = function(geo, d, brng) {
        var lat1 = self.toRad(geo.latitude);
        var lon1 = self.toRad(geo.longitude);
        var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) +
            Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
        var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1),
            Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));

        return { latitude: self.toDeg(lat2), longitude: self.toDeg(lon2) };
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
     * math util to convert radians to latlong/degrees
     * @param value
     * @returns {number}
     */
    this.toDeg = function(value) {
        return value * 180 / Math.PI;
    }

});