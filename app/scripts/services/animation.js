app.service('animation', function() {
    var self = this;

    /** should we try to use request animation frame? -
     *  unavailable on mobile webviews and some browsers*/
    this.useRequestAnimationFrame = true;

    /** tick interval in milliseconds if using setInterval for animation timing */
    this.tickInterval = 25;

    /**
     * start animation
     * @param animation
     * @param framecallback
     * @param animationcallback
     */
    this.start = function(anim, framecallback, animationcallback) {
        self.frames = anim.frames;
        self.target = anim.target;
        self.targetref = anim.targetref;
        self.pause = 0;
        self.framecb = framecallback;
        self.animcb = animationcallback;
        if (window.requestAnimationFrame && self.useRequestAnimationFrame) {
            self._drawFrame();
        } else {
            self.useRequestAnimationFrame = false;
            self.tick = setInterval(self._drawFrame, self.tickInterval);
        }
    }

    /**
     * draw frame
     * @private
     */
    this._drawFrame = function() {
        if (self.pause > 0) {
            self.pause --;
            if (self.useRequestAnimationFrame) {
                requestAnimationFrame(self._drawFrame);
            }
            return;
        }
        if (self.frames.length == 0) {
            if (self.animcb) {
                self.animcb.apply(this);
            }
            clearInterval(self.tick);
            return;
        }
        var f = self.frames.pop();
        if (f.pause) {
            self.pause = f.pause-1;
            if (self.useRequestAnimationFrame) {
                requestAnimationFrame(self._drawFrame);
            }
            return;
        }

        self.framecb.apply(this, [self.target, self.targetref, f]);
        if (self.useRequestAnimationFrame) {
            requestAnimationFrame(self._drawFrame);
        }
    }
});