app.service('mapping', function($http, geotracker, geomath) {
    var self = this;

    /** markers by name */
    this.markers = {};

    /** configuration for maps */
    this.config = {
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
        animationSteps: 100,
        closeUpZoom: 19,
        cameraAnimationSteps: 200
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
     * animate camera to geoposition
     * @param coords
     * @param config
     * @param callback
     */
    this.animateCameraTo = function(coords, config, callback) {
        var distance = geomath.calculateDistance(self.map.getCenter(), coords);
        var bearing = geomath.calculateBearing(self.map.getCenter(), coords);
        var distance_step = distance / self.config.cameraAnimationSteps;
        var frames = [];
        for (var c = 0; c < self.config.cameraAnimationSteps; c++) {
            var obj = {};
            obj.coords = geomath.projectOut(self.map.getCenter(), distance_step * c, bearing+180);
            if (config.animation = "arc") {
                obj.zoom = parseInt(self.map.getZoom() + (self.config.closeUpZoom - self.map.getZoom()) * Math.sin(c / self.config.cameraAnimationSteps * Math.PI/2));
            }
            frames.push(obj);
        }
        if (config.returnToOriginal == true) {
            frames.push({ pause: 50 });
            frames = frames.concat(frames.slice(0).reverse());
        }
        self._startAnimation(frames, "camera", self.map, callback);
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
            obj.coords = geomath.projectOut(ref.coords, distance_step * c, angle-90);
            if (config.animation = "arc") {
                obj.size = ref.marker.icon.size.width * Math.sin(c / self.config.animationSteps * Math.PI) + ref.marker.icon.size.width
            }
            frames.push(obj);
        }
        frames.reverse();
        self._startAnimation(frames, "marker", ref, callback);
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
     * start animation against a frame list
     * @param frames
     * @param targetType
     * @param target
     * @param callback
     * @private
     */
    this._startAnimation = function(frames, targetType, target, callback) {
        var pause = 0;
        var lastZoom = 0;
        var animf = function() {
            if (pause > 0) {
                pause --;
                requestAnimationFrame(animf);
                return;
            }
            if (frames.length == 0) {
                if (callback) {
                    callback.apply(this);
                }
                return;
            }
            var f = frames.pop();
            if (f.pause) {
                pause = f.pause-1;
                requestAnimationFrame(animf);
                return;
            }

            switch (targetType) {
                case "marker":
                    if (f.size) {
                        target.marker.icon.scaledSize = new google.maps.Size(f.size, f.size);
                        target.marker.icon.size = new google.maps.Size(f.size, f.size);
                    }
                    self.moveMarkerTo(target, f.coords);
                    break;

                case "camera":
                    if (f.zoom && f.zoom != lastZoom) {
                        lastZoom = f.zoom;
                        target.setZoom(f.zoom);
                    }

                    target.panTo( new google.maps.LatLng(f.coords.latitude, f.coords.longitude) );
                    break;
            }
            requestAnimationFrame(animf);
        };
        requestAnimationFrame(animf);
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
                        'images/golfer.png',
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
                        'images/golf-ball.png',
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