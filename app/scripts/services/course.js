app.service('course', function(places) {
    var self = this;

    /**
     * initialize the course with the holes
     * @param holes
     */
    self.load = function(geo, callback) {
        self._cb = callback;
        places.search(500, self._onPlaces, geo);
    }

    /**
     * generate course using specific number of holes
     * @param numberOfHoles
     */
    self.generateCourse = function(numberOfHoles) {
        // reset holes from places data
        self.holes = places.places.slice();
        self.holes.reverse();
        while (self.holes.length > numberOfHoles) {
            self.holes.pop();
        }
        return self.holes;
    }

    /**
     * remove hole
     * @param hole
     */
    self.removeHole = function(hole) {
        var delhle = -1;
        for (var c = 0; c < self.holes.length; c++) {
            if (hole.num == self.holes[c].num) {
                delhle = c;
            }
        }

        if (delhle > -1) {
            self.holes.splice(delhle, 1);
            self._reindex();
        }
    }

    /**
     * get hole at index
     * @param indx
     * @returns {*}
     */
    self.getHoleAtIndex = function(indx) {
        return self.holes[indx];
    }

    /**
     * get current hole
     * @returns {*}
     */
    self.getCurrentHole = function() {
        if (!self._indx || self._indx < 0) {
            self._indx = 0;
        }

        return self.holes[self._indx];
    }

    /**
     * get next hole
     * @returns {*}
     */
    self.getNextHole = function() {
        if (!self._indx || self._indx < 0) {
            self._indx = 0;
        } else {
            self._indx ++;
        }

        if (self._indx >= self.holes.length) {
            self._indx = 0;
        }
        return self.holes[self._indx];
    }

    /**
     * re-index the holes in our course
     * @private
     */
    self._reindex = function() {
        for (var h = 0; h < self.holes.length; h++) {
            self.holes[h].index = h;
            self.holes[h].num = h+1;
        }
    }

    /**
     * places callback
     * @private
     */
    self._onPlaces = function() {
        self.holes = places.places.slice();
        self.holes.reverse();
        self._reindex();

        if (self._cb) {
            self._cb.apply(this);
        }
    }

});