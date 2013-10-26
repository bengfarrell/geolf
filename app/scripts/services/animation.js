app.service('animation', function() {
    var self = this;

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
        self._drawFrame();
    }

    /**
     * draw frame
     * @private
     */
    this._drawFrame = function() {
        if (self.pause > 0) {
            self.pause --;
            requestAnimationFrame(self._drawFrame);
            return;
        }
        if (self.frames.length == 0) {
            if (self.animcb) {
                self.animcb.apply(this);
            }
            return;
        }
        var f = self.frames.pop();
        if (f.pause) {
            self.pause = f.pause-1;
            requestAnimationFrame(self._drawFrame);
            return;
        }

        self.framecb.apply(this, [self.target, self.targetref, f]);
        requestAnimationFrame(self._drawFrame);
    }
});