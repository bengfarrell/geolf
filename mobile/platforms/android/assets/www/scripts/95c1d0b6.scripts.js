"use strict";var app=angular.module("geolfApp",[]);app.config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/setup.html",controller:"SetupController"}).when("/game",{templateUrl:"views/game.html",controller:"GameController"}).otherwise({redirectTo:"/"})}]),app.controller("GeolfController",["$scope",function(a){a.holes=[],a.debug=!1}]),app.controller("GameController",["$scope","$location","geotracker","geomath","mapping","state",function(a,b,c,d,e,f){a.init=function(){a.state=f,c.start(),c.subscribe(function(){a.initialized||a.initializeGreen(),a.ball&&(a.ball.distanceTo=d.calculateDistance(c.geo.coords,a.ball.coords),a.ball.inRange=a.ball.distanceTo<10,e.moveMarkerTo(a.player,c.geo.coords),a.$apply())})},a.initializeGreen=function(){a.initialized=!0,e.create("map-canvas"),a.player=e.addMarker("me","me"),f.setState(a,"GamePlay.BeforeTeeOff"),a.currentHole=a.holes[0],e.addMarker("loc",a.currentHole.name,a.currentHole.location),a.$apply()},a.findBall=function(){f.setState(a,"Animating"),e.animateCameraTo(a.ball.coords,{animation:"arc",returnToOriginal:!0},function(){f.undoState()})},a.teeoff=function(){a.ball||(a.ball=e.addMarker("ball","ball"),a.ball.distanceTo=d.calculateDistance(c.geo.coords,a.ball.coords),a.ball.bearingTo=d.calculateBearing(c.geo.coords,a.ball.coords)-90,a.ball.inRange=a.ball.distanceTo<10||self.debug),f.setState(a,"GamePlay.AfterTeeOff"),a.swing()},a.swing=function(){f.setState(a,"Animating"),e.animateMarkerBy(a.ball,a.power,a.direction,{animation:"arc"},function(){f.undoState(),a.ball.distanceTo=d.calculateDistance(c.geo.coords,a.ball.coords),a.ball.bearingTo=d.calculateBearing(c.geo.coords,a.ball.coords)-90,a.ball.inRange=a.ball.distanceTo<10||self.debug,a.$apply()})},a.onPlaces=function(){f.setState(a,"GamePlay.BeforeTeeOff");var b=places.getFarthest();e.addMarker("loc",b.name,b.location),a.$apply()},a.init()}]),app.controller("SetupController",["$scope","$location","geotracker","places","mapping","state","orientation",function(a,b,c,d,e,f){a.init=function(){a.state=f,f.setState(a,"Loading"),c.getCurrent(function(b){e.create("map-canvas",b),d.search(500,a.onPlaces,b)})},a.startGame=function(c){a.debug=c?!0:!1,b.url("/game")},a.onPlaces=function(){d.places.reverse();for(var b=0;b<d.places.length;b++)d.places[b].num=b+1,18>b&&a.holes.push(d.places[b]);f.setState(a,"Loaded"),a.$apply()},a.init()}]),app.service("geotracker",function(){var a=this;this.config={enableHighAccuracy:!0,maximumAge:5e3},this.listeners=[],this.getCurrent=function(b){navigator.geolocation.getCurrentPosition(b,a.error,a.config)},this.start=function(b){b&&(a.config=b),navigator.geolocation.watchPosition(a.updated,a.error,a.config)},this.subscribe=function(b){a.listeners.push(b)},this.updated=function(b){a.accuracy=b.coords.accuracy,a.geo=b,a.listeners.forEach(function(a){a.apply(this,[b])})},this.error=function(a){switch(a.code){case a.PERMISSION_DENIED:console.log("User denied the request for Geolocation.");break;case a.POSITION_UNAVAILABLE:console.log("Location information is unavailable.");break;case a.TIMEOUT:console.log("The request to get user location timed out.");break;case a.UNKNOWN_ERROR:console.log("An unknown error occurred.")}}}),app.service("places",["$http","geotracker","geomath","mapping",function(a,b,c,d){var e=this;e.places=[],this.config={providerName:"GooglePlaces"},this.init=function(){b.subscribe(e.updateDistances)},this.search=function(a,c,f){if(e.callback=c,"GooglePlaces"==e.config.providerName){f||(f=b.geo);var g=new google.maps.LatLng(f.coords.latitude,f.coords.longitude),h=new google.maps.places.PlacesService(d.map);h.nearbySearch({radius:a,location:g},e._onPlacesFound)}},this.getClosest=function(){return 0==e.places.length?null:e.places[0]},this.getFarthest=function(){return 0==e.places.length?null:e.places[e.places.length-1]},this.sortByProximity=function(){e.places=e.places.sort(function(a,b){return a.distance-b.distance})},this.updateDistances=function(){b.geo&&e.places&&(e.places.forEach(function(a){a.distance=c.calculateDistance(a.location,b.geo.coords)}),e.sortByProximity())},this._onPlacesFound=function(a){"GooglePlaces"==e.config.providerName&&a.forEach(function(a){var b={location:{latitude:a.geometry.location.lb,longitude:a.geometry.location.mb},name:a.name};e.places.push(b)}),e.updateDistances(),e.callback.apply(this,[e.places])},this.init()}]),app.service("mapping",["$http","geotracker","geomath","animation",function(a,b,c,d){var e=this;this.markers={},this.config={google:{zoom:16,mapTypeId:google.maps.MapTypeId.TERRAIN,disableDefaultUI:!0},animationSteps:100,closeUpZoom:20,cameraAnimationSteps:100},this.addMarker=function(a,c,d){d||(d=b.geo.coords),e.markers[c]=e._markerFactory(a);var f=new google.maps.LatLng(d.latitude,d.longitude);return e.markers[c].setPosition(f),{marker:e.markers[c],coords:d}},this.animateCameraTo=function(a,b,f){for(var g=c.calculateDistance(e.map.getCenter(),a),h=c.calculateBearing(e.map.getCenter(),a),i=g/e.config.cameraAnimationSteps,j=[],k=0;k<e.config.cameraAnimationSteps;k++){var l={};l.coords=c.projectOut(e.map.getCenter(),i*k,h+180),j.push(l)}for(var k=0;k<e.config.cameraAnimationSteps;k++){var l={};(b.animation="arc")&&(l.zoom=parseInt(e.map.getZoom()+(e.config.closeUpZoom-e.map.getZoom())*Math.sin(k/e.config.cameraAnimationSteps*Math.PI/2))),j.push(l)}1==b.returnToOriginal&&(j.push({pause:20}),j=j.concat(j.slice(0).reverse())),d.start({targetref:e.map,target:"camera",frames:j},e._onAnimationFrame,f)},this.animateMarkerBy=function(a,b,f,g,h){for(var i=b/e.config.animationSteps,j=[],k=0;k<e.config.animationSteps;k++){var l={};l.coords=c.projectOut(a.coords,i*k,f-90),(g.animation="arc")&&(l.size=a.marker.icon.size.width*Math.sin(k/e.config.animationSteps*Math.PI)+a.marker.icon.size.width),j.push(l)}j.reverse(),d.start({targetref:a,target:"marker",frames:j},e._onAnimationFrame,h)},this.moveMarkerTo=function(a,b){a.marker.setPosition(new google.maps.LatLng(b.latitude,b.longitude)),a.coords=b},this.moveMarkerBy=function(a,b,d){var e=c.projectOut(a.coords,b,d);this.moveMarkerTo(a,e)},this.create=function(a,c){var d;return d=c?new google.maps.LatLng(c.coords.latitude,c.coords.longitude):new google.maps.LatLng(b.geo.coords.latitude,b.geo.coords.longitude),e.config.google.center=d,e.map=new google.maps.Map(document.getElementById(a),e.config.google),b.subscribe(function(a){e.map.setCenter(new google.maps.LatLng(a.coords.latitude,a.coords.longitude))}),e.map},this._onAnimationFrame=function(a,b,c){switch(a){case"marker":c.size&&(b.marker.icon.scaledSize=new google.maps.Size(c.size,c.size),b.marker.icon.size=new google.maps.Size(c.size,c.size)),e.moveMarkerTo(b,c.coords);break;case"camera":c.zoom&&c.zoom!=e.lastZoom&&(e.lastZoom=c.zoom,b.setZoom(c.zoom)),c.coords&&b.panTo(new google.maps.LatLng(c.coords.latitude,c.coords.longitude))}},this._markerFactory=function(a){switch(a){case"me":return new google.maps.Marker({map:e.map,icon:new google.maps.MarkerImage("images/player.png",new google.maps.Size(40,60),new google.maps.Point(0,0),new google.maps.Point(Math.floor(20),Math.floor(30)),new google.maps.Size(40,60))});case"ball":return new google.maps.Marker({map:e.map,icon:new google.maps.MarkerImage("images/golf-ball.png",new google.maps.Size(15,15),new google.maps.Point(0,0),new google.maps.Point(Math.floor(7.5),Math.floor(7.5)),new google.maps.Size(15,15))});default:return new google.maps.Marker({map:e.map})}}}]),app.service("geomath",function(){var a=this,b=6371e3;this.calculateDistance=function(c,d){a.convertFromGoogle([c,d]);var e=a.toRad(c.latitude-d.latitude),f=a.toRad(c.longitude-d.longitude),g=a.toRad(d.latitude),h=a.toRad(c.latitude),i=Math.sin(e/2)*Math.sin(e/2)+Math.sin(f/2)*Math.sin(f/2)*Math.cos(g)*Math.cos(h),j=2*Math.atan2(Math.sqrt(i),Math.sqrt(1-i));return parseInt(b*j)},this.calculateBearing=function(b,c){a.convertFromGoogle([b,c]),a.toRad(b.latitude-c.latitude);var d=a.toRad(b.longitude-c.longitude),e=a.toRad(c.latitude),f=a.toRad(b.latitude),g=Math.sin(d)*Math.cos(f),h=Math.cos(e)*Math.sin(f)-Math.sin(e)*Math.cos(f)*Math.cos(d),i=a.toDeg(Math.atan2(g,h));return i},this.projectOut=function(c,d,e){a.convertFromGoogle([c]);var f=a.toRad(c.latitude),g=a.toRad(c.longitude),e=a.toRad(e),h=Math.asin(Math.sin(f)*Math.cos(d/b)+Math.cos(f)*Math.sin(d/b)*Math.cos(e)),i=g+Math.atan2(Math.sin(e)*Math.sin(d/b)*Math.cos(f),Math.cos(d/b)-Math.sin(f)*Math.sin(h));return{latitude:a.toDeg(h),longitude:a.toDeg(i)}},this.convertFromGoogle=function(a){a.forEach(function(a){a.lb&&a.mb&&(a.latitude=a.lb,a.longitude=a.mb)})},this.toRad=function(a){return a*Math.PI/180},this.toDeg=function(a){return 180*a/Math.PI}}),app.service("animation",function(){var a=this;this.useRequestAnimationFrame=!0,this.tickInterval=25,this.start=function(b,c,d){a.frames=b.frames,a.target=b.target,a.targetref=b.targetref,a.pause=0,a.framecb=c,a.animcb=d,window.requestAnimationFrame&&a.useRequestAnimationFrame?a._drawFrame():(a.useRequestAnimationFrame=!1,a.tick=setInterval(a._drawFrame,a.tickInterval))},this._drawFrame=function(){if(a.pause>0)return a.pause--,a.useRequestAnimationFrame&&requestAnimationFrame(a._drawFrame),void 0;if(0==a.frames.length)return a.animcb&&a.animcb.apply(this),clearInterval(a.tick),void 0;var b=a.frames.pop();return b.pause?(a.pause=b.pause-1,a.useRequestAnimationFrame&&requestAnimationFrame(a._drawFrame),void 0):(a.framecb.apply(this,[a.target,a.targetref,b]),a.useRequestAnimationFrame&&requestAnimationFrame(a._drawFrame),void 0)}}),app.service("state",function(){var a=this;this.stateHistory=[],this.currentState="none",this.setState=function(b,c){return a.stateHistory.push(a.currentState),a.currentState=c,a.currentState},this.addSubState=function(b,c){return a.stateHistory.push(a.currentState),a.currentState=state+"."+c,a.currentState},this.removeSubState=function(){a.stateHistory.push(a.currentState);var b=a.currentState.split(".");b.pop(),a.currentState=b.join(".")},this.getState=function(){return a.currentState},this.undoState=function(){return a.currentState=a.stateHistory.pop(),a.currentState}}),app.service("orientation",function(){var a=this;window.DeviceMotionEvent?(a.supported=!0,window.addEventListener("devicemotion",deviceMotionHandler,!1)):a.supported=!1,this.deviceMotionHandler=function(a){console.log(a)}}),app.directive("compass",function(){return{restrict:"E",link:function(a,b,c){c.$observe("direction",function(a){b.css("-webkit-transform","rotate("+a+"deg)")})}}}),app.directive("ngDisable",function(){return function(a,b,c){c.$observe("ngDisable",function(a){"false"==a&&(a=!1),1==Boolean(a)?b.removeAttr("disabled"):b.attr("disabled","disabled")})}}),app.directive("state",function(){return function(a,b,c){a.$watch("state.currentState",function(a){a&&(a.substr(0,c.state.length)==c.state?b.css("display",""):b.css("display","none"))})}});