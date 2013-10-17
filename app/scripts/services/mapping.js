angular.module('geolfApp').service('mapping', function($http, geotracker) {
    var self = this;

    /** markers by name */
    this.markers = {};

    /** configuration for maps */
    this.config = {
        zoom: 19,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true
    };

    /**
     * add a marker
     * @param type
     * @param name
     * @param coords
     */
    this.addMarker = function(type, name, coords) {
        self.markers[name] = self._markerFactory(type);
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        self.markers[name].setPosition(latlng);
    }

    /**
     * create the map
     * @param center
     * @returns {Function|map|*|exports.minify.map|optionTypes.map|SourceNode.toStringWithSourceMap.map}
     */
    this.create = function(center) {
        if (center) {
            self.config.center = center;
        } else {
            var ll = new google.maps.LatLng(geotracker.geo.coords.latitude, geotracker.geo.coords.longitude)
            self.config.center = ll;
        }
        self.map = new google.maps.Map(document.getElementById('map-canvas'), self.config);
        return self.map;
    }

    /**
     * make a marker
     * @param type
     * @private
     */
    this._markerFactory = function(type) {
        switch (type) {
            case "me":
                return new google.maps.Marker({
                    map: self.map,
                    icon: new google.maps.MarkerImage(
                        'assets/golfer.png',
                        new google.maps.Size(40, 60),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(Math.floor(40/2), Math.floor(60/2)),
                        new google.maps.Size(40, 60)
                    )
                });
            default:
                return new google.maps.Marker({
                    map: self.map
                });

        }
    }
});