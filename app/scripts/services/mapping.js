app.service('mapping', function($http, geotracker, geomath, animation) {
    var self = this;

    /** markers by name */
    this.markers = {};

    /** configuration for maps */
    this.config = {
        google: {
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            disableDefaultUI: true
        },
        animationSteps: 100,
        closeUpZoom: 20,
        cameraAnimationSteps: 100
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
        self.markers[name] = self._markerFactory(type, coords);
        return { marker: self.markers[name], coords: coords};
    }

    /**
     * remove marker
     * @param ref
     */
    this.removeMarker = function(ref) {
        for (var c in self.markers) {
            if (self.markers[c] == ref) {
                self.markers.splice(c, 1);
            }
        }
        ref.marker.setMap(null);
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
            frames.push(obj);
        }
        /* ditch the zooming for now - on the type of map I'm using it doesn't go further
            for (var c = 0; c < self.config.cameraAnimationSteps; c++) {
            var obj = {};
            if (config.animation = "arc") {
                obj.zoom = parseInt(self.map.getZoom() + (self.config.closeUpZoom - self.map.getZoom()) * Math.sin(c / self.config.cameraAnimationSteps * Math.PI/2));
            }
            frames.push(obj);
        }*/
        if (config && config.returnToOriginal == true) {
            frames.push({ pause: 20 });
            frames = frames.concat(frames.slice(0).reverse());
        }

       frames.reverse();
       animation.start({ targetref: self.map, target: "camera", frames: frames },
            self._onAnimationFrame, callback);
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
        animation.start({ targetref: ref, target: "marker", frames: frames },
            self._onAnimationFrame, callback);
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
     * @param map ID (in DOM)
     * @param center
     * @returns {Function|map|*|exports.minify.map|optionTypes.map|SourceNode.toStringWithSourceMap.map}
     */
    this.create = function(mID, center) {
        var ll;
        if (center) {
            ll = new google.maps.LatLng(center.coords.latitude, center.coords.longitude)
        } else {
            ll = new google.maps.LatLng(geotracker.geo.coords.latitude, geotracker.geo.coords.longitude)
        }
        self.config.google.center = ll;
        self.map = new google.maps.Map(document.getElementById(mID), self.config.google);

        geotracker.subscribe(function(geo) {
            self.map.setCenter(new google.maps.LatLng(geo.coords.latitude, geo.coords.longitude));
        });
        return self.map;
    }

    /**
     * animation frame callback
     * @param target
     * @param targetref
     * @param frame
     * @private
     */
    this._onAnimationFrame = function(target, targetref, f) {
        switch (target) {
            case "marker":
                if (f.size) {
                    targetref.marker.icon.scaledSize = new google.maps.Size(f.size, f.size);
                    targetref.marker.icon.size = new google.maps.Size(f.size, f.size);
                }
                self.moveMarkerTo(targetref, f.coords);
                break;

            case "camera":
                if (f.zoom && f.zoom != self.lastZoom) {
                    self.lastZoom = f.zoom;
                    targetref.setZoom(f.zoom);
                }

                if (f.coords) {
                    targetref.panTo( new google.maps.LatLng(f.coords.latitude, f.coords.longitude) );
                }
                break;
        }
    }

    /**
     * make a marker
     * @param type
     * @private
     */
    this._markerFactory = function(type, coords) {
        var latlng;
        if (coords) {
            latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
        }
        switch (type) {
            case "player":
                return new google.maps.Marker({
                    map: self.map,
                    position: latlng,
                    zIndex: -99,
                    flat: true,
                    icon: {
                        anchor: new google.maps.Point(168, 900),
                        path: "M 337.14285,951.79076 C 336.85134,1085.9601 1.8926143,1088.4865 -5.7142858e-6,951.79076 -5.7142858e-6,827.13221 169.31441,188.15081 168.57142,198.07649 c 0,0 168.57143,629.05572 168.57143,753.71427 z",
                        fillColor: '#333',
                        fillOpacity: 1,
                        strokeColor: '',
                        strokeWeight: 0,
                        scale:.035
                    }
                });

            case "ball":
                return new google.maps.Marker({
                    map: self.map,
                    position: latlng,
                    zIndex: 1,
                    icon: new google.maps.MarkerImage(
                        'images/golf-ball.png',
                        new google.maps.Size(15, 15),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(Math.floor(15/2), Math.floor(15/2)),
                        new google.maps.Size(15, 15)
                    ),
                });

            case "dot":
                return new google.maps.Marker({
                    map: self.map,
                    position: latlng,
                    icon: new google.maps.MarkerImage(
                        'images/reddot.png',
                        new google.maps.Size(8, 8),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(Math.floor(8/2), Math.floor(8/2)),
                        new google.maps.Size(8, 8)
                    )
                });

            default:
                return new google.maps.Marker({
                    position: latlng,
                    map: self.map
                });

        }
    }
});