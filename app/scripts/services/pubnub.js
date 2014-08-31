app.service('pubnub', function() {
    var self = this;

    /** listeners */
    this.listeners = [];

    /** current players */
    this.players = {};

    /** player count */
    this.playerCount = 0;

    /** this player's UUID */
    this.myUUID = "";

    // pubnub channel
    this.channel = "geolfwar";

    /**
     * start tracking
     */
    this.start = function() {
        this.myUUID = self.generateUUID();
        self.pubnub = PUBNUB.init({
            publish_key: 'pub-c-3ef6d2b9-31ab-4576-9491-dab602f035d2',
            subscribe_key: 'sub-c-be003138-fb60-11e3-aa40-02ee2ddab7fe',
            uuid: self.myUUID
        });

        self.pubnub.subscribe({
            channel: self.channel,
            message: function(message) {
                message = JSON.parse(message);

                if (message.uuid == self.myUUID || !message.uuid) { return; } // don't act on our own messages
                if (message.type == "geo" || message.type == "players" ) {
                    if (!self.players[message.uuid]) {
                        self.players[message.uuid] = {};
                    }

                    self.players[message.uuid].geo = message.geo;
                    self.players[message.uuid].timestamp = new Date();
                    self.players[message.uuid].active = true;
                    self.update("geo", self);
                } else {
                    self.update("ball", message);
                }
            }
        });

        self.pubnub.here_now({
            channel: self.channel,
            callback : function(m){
                self.populatePlayers(m.uuids);
                self.playerCount = m.occupancy;
                self.update("players");
                console.log("Multiplayer Mode: " + m.occupancy + " players");
            }
        });
    };

    /**
     * update ball
     * @param geo
     */
    this.updateBall = function(props) {
        props.type = "ball";
        props.uuid = self.myUUID;

        self.pubnub.publish({
            channel: self.channel,
            message : JSON.stringify(props)
        })
    }

    /**
     * update geolocation
     * @param geo
     */
    this.updateGeo = function(geo) {
        self.pubnub.publish({
            channel: self.channel,
            message : JSON.stringify({ type: "geo", geo: geo, uuid: self.myUUID })
        })
    }

    /**
     * stop
     */
    this.stop = function() {
    }

    /**
     * subscribe to orientation service
     * @param eventtype
     * @param callback
     */
    this.subscribe = function(eventtype, callback) {
        self.listeners.push({ event: eventtype, callback: callback });
    }

    /**
     * remove all the listeners
     */
    this.removeAllListeners = function() {
        self.listeners = [];
    }

    /**
     * update listeners
     * @param messagetype
     */
    this.update = function(mtype, message) {
        self.listeners.forEach( function(l) {
            if (l.event == mtype) {
                if (mtype == "geo" || mtype == "players") {
                    l.callback.apply(this, [{playerCount: self.playerCount, players: self.players }]);
                } else {
                    // just "ball" updates right now
                    l.callback.apply(this, [message]);
                }
            }
        });
    }

    /**
     * generate UUID
     * @returns {string}
     */
    this.generateUUID = function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };


    /**
     * update the players to be inactive if they haven't sent geo data in a while
     */
    this.updatePlayerList = function() {
        var activeCount = 0;
        var now = new Date();
        for (var c in self.players) {
            if ( now.getTime() - self.players[c].timestamp.getTime() > 10) {
                self.players[c].active = false;
            }
            if (self.players[c].active) {
                activeCount ++;
            }

            console.log(self.players[c].active, self.players[c].uuid)

            self.playerCount ++;
        }
    }
    /**
     * populate players
     * @param {array} guid list from here-now cb
     */
    this.populatePlayers = function(guidlist) {
        // inactivate all players
      /*  for (var c in self.players) {
            self.players[c].active = false;
        }

        // build them back up based on the current list
        for (var c in guidlist) {
            if (!self.players[guidlist[c]] && guidlist[c] != self.myUUID) {
                self.players[guidlist[c]] = { guid: guidlist[c]};
            }

            self.players[guidlist[c]].active = true;
        }*/
    }
});