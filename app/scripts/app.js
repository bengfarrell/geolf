'use strict';
var app = angular.module('geolfApp', ['ngRoute', 'ui.bootstrap']);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/intro.html',
            controller: 'IntroController'
        })
        .when('/drivingrange', {
            templateUrl: 'views/drivingrange.html',
            controller: 'DrivingRangeController'
        })
        .when('/setupgame', {
            templateUrl: 'views/setupgame.html',
            controller: 'SetupGameController'
        })
        .when('/game', {
            templateUrl: 'views/game.html',
            controller: 'GameController'
        })
        .when('/scorecard', {
            templateUrl: 'views/scorecard.html',
            controller: 'ScoreCardController'
        })
      .otherwise({
        redirectTo: '/'
      });
  });
