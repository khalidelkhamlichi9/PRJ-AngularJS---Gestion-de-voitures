'use strict';

angular.module('monApplication.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'dashboardCtrl'
  });
}])

.controller('dashboardCtrl', ['$scope', function($scope) {
  $scope.stats = { voitures: 0, clients: 0, locations: 0, disponibles: 0 };
  $scope.recentLocations = [];
  $scope.notifications = [];
  $scope.loading = true;

  var today = new Date().toISOString().split('T')[0];
  var tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Load all data
  Promise.all([
    firebase.firestore().collection('cars').get(),
    firebase.firestore().collection('clients').get(),
    firebase.firestore().collection('locations').get()
  ]).then(function(results) {
    var cars = [], clients = [], locations = [];

    results[0].forEach(function(d) { cars.push({ id: d.id, ...d.data() }); });
    results[1].forEach(function(d) { clients.push({ id: d.id, ...d.data() }); });
    results[2].forEach(function(d) { locations.push({ id: d.id, ...d.data() }); });

    var activeLocations = locations.filter(function(l) { return l.status === 'rented'; });
    var disponibles = cars.length - activeLocations.length;

    $scope.stats = {
      voitures: cars.length,
      clients: clients.length,
      locations: activeLocations.length,
      disponibles: disponibles < 0 ? 0 : disponibles
    };

    // Recent locations (last 5)
    $scope.recentLocations = locations.slice(-5).reverse().map(function(l) {
  
        function formatDate(val) {
            if (!val) return '-';
            if (val && val.seconds) {
            return new Date(val.seconds * 1000).toLocaleDateString('fr-FR');
            }
            return val;
        }

        return {
            client: l.clientNumero || '-',
            voiture: l.voitureNumero || '-',
            debut: formatDate(l.startDate),
            fin: formatDate(l.endDate),
            status: l.status === 'rented' ? 'active' : 'terminée'
        };
        });

    // Notifications — locations ending soon
    var notifs = [];
    activeLocations.forEach(function(l) {
      if (l.endDate === today) {
        notifs.push({ type: 'danger', msg: '⚠️ Voiture N°' + l.voitureNumero + ' — retour aujourd\'hui!' });
      } else if (l.endDate === tomorrow) {
        notifs.push({ type: 'warning', msg: '🔔 Voiture N°' + l.voitureNumero + ' — retour demain' });
      }
    });
    $scope.notifications = notifs;

    $scope.loading = false;
    $scope.$apply();
  }).catch(function(err) {
    console.error(err);
    $scope.loading = false;
    $scope.$apply();
  });
}]);