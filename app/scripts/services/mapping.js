app.service('mapping', function($http, geotracker, geomath) {
    var self = this;

    /** markers by name */
    this.markers = {};

    /** configuration for maps */
    this.config = {
        zoom: 19,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
        animationSteps: 100
    };

    /**
     * add a marker
     * @param type
     * @param name
     * @param coords
     */
    this.addMarker = function(type, name, coords) {
        if (!coords) {
            coords = geotracker.geo.coords;
        }
        self.markers[name] = self._markerFactory(type);
        var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        self.markers[name].setPosition(latlng);
        return { marker: self.markers[name], coords: coords};
    }

    /**
     * animate marker to a position based on distance and angle
     * @param ref
     * @param distance
     * @param angle
     */
    this.animateMarkerBy = function(ref, distance, angle, config, callback) {
        var distance_step = distance / self.config.animationSteps;
        var frames = [];
        for (var c = 0; c < self.config.animationSteps; c++) {
            var obj = {};
            obj.coords = geomath.projectOut(ref.coords, distance_step * c, angle);
            if (config.animation = "arc") {
                obj.size = ref.marker.icon.size.width * Math.sin(c / self.config.animationSteps * Math.PI) + ref.marker.icon.size.width
            }
            frames.push(obj);
        }
        frames.reverse();

        requestAnimationFrame(function() {
            if (frames.length == 0) {
                if (callback) {
                    callback.apply(this);
                }
                return;
            }
            var f = frames.pop();
            if (f.size) {
                ref.marker.icon.scaledSize = new google.maps.Size(f.size, f.size);
                ref.marker.icon.size = new google.maps.Size(f.size, f.size);
            }
            self.moveMarkerTo(ref, f.coords);
            requestAnimationFrame(arguments.callee);
        });
    }

    /**
     * move marker to coordinates
     * @param ref
     * @param coords
     */
    this.moveMarkerTo = function(ref, coords) {
        ref.marker.setPosition(new google.maps.LatLng(coords.latitude, coords.longitude));
        ref.coords = coords;
    }

    /**
     * move marker by a specific distance at a specific angle
     * @param ref
     * @param distance
     * @param angle
     */
    this.moveMarkerBy = function(ref, distance, angle) {
        var moveto = geomath.projectOut(ref.coords, distance, angle);
        this.moveMarkerTo(ref, moveto);
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

            case "ball":
                return new google.maps.Marker({
                    map: self.map,
                    icon: new google.maps.MarkerImage(
                        'assets/golf-ball.png',
                        new google.maps.Size(15, 15),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(Math.floor(15/2), Math.floor(15/2)),
                        new google.maps.Size(15, 15)
                    )
                });

            default:
                return new google.maps.Marker({
                    map: self.map
                });

        }
    }
});