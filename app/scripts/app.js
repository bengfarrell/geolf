'use strict';
var app = angular.module('geolfApp', ['ngRoute', 'ui.bootstrap']);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/setup.html',
            controller: 'SetupController'
        })
        .when('/game', {
            templateUrl: 'views/game.html',
            controller: 'GameController'
        })
      .otherwise({
        redirectTo: '/'
      });
  });
