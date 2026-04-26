// Auth protection
firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    window.location.href = 'login.html';
  }
});

var db = firebase.firestore();

// Dark mode init
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

angular.module('monApplication', [
  'ngRoute',
  'monApplication.dashboard',
  'monApplication.cars',
  'monApplication.clients',
  'monApplication.garage',
  'monApplication.addCar',
  'monApplication.addClient',
  'monApplication.editCar',
  'monApplication.editClient',
  'monApplication.location',
  'monApplication.success'
])
.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');
  $routeProvider.otherwise({ redirectTo: '/dashboard' });
}])
.run(['$rootScope', '$location', function($rootScope, $location) {

  // Logout
  $rootScope.logout = function() {
    firebase.auth().signOut().then(function() {
      window.location.href = 'login.html';
    });
  };

  // Dark mode toggle
  $rootScope.darkMode = localStorage.getItem('darkMode') === 'true';
  $rootScope.toggleDark = function() {
    $rootScope.darkMode = !$rootScope.darkMode;
    localStorage.setItem('darkMode', $rootScope.darkMode);
    document.documentElement.setAttribute('data-theme', $rootScope.darkMode ? 'dark' : 'light');
  };

  // Global search
  $rootScope.searchQuery = '';
  $rootScope.searchResults = [];
  $rootScope.showSearch = false;

  $rootScope.globalSearch = function() {
    var q = $rootScope.searchQuery.toLowerCase().trim();
    if (!q) { $rootScope.searchResults = []; $rootScope.showSearch = false; return; }

    $rootScope.showSearch = true;
    var results = [];

    Promise.all([
      firebase.firestore().collection('cars').get(),
      firebase.firestore().collection('clients').get()
    ]).then(function(snapshots) {
      snapshots[0].forEach(function(d) {
        var car = d.data();
        if ((car.marque && car.marque.toLowerCase().includes(q)) ||
            (car.modele && car.modele.toLowerCase().includes(q)) ||
            (String(car.numero).includes(q))) {
          results.push({ type: '🚗 Voiture', label: car.marque + ' ' + car.modele + ' — N°' + car.numero, link: '#!/editCar/' + d.id });
        }
      });
      snapshots[1].forEach(function(d) {
        var c = d.data();
        if ((c.nom && c.nom.toLowerCase().includes(q)) ||
            (c.prenom && c.prenom.toLowerCase().includes(q)) ||
            (c.Numero && String(c.Numero).toLowerCase().includes(q))) {
          results.push({ type: '👤 Client', label: c.nom + ' ' + c.prenom + ' — ' + c.Numero, link: '#!/editClient/' + d.id });
        }
      });
      $rootScope.searchResults = results;
      $rootScope.$apply();
    });
  };

  $rootScope.goToResult = function(link) {
    $rootScope.searchQuery = '';
    $rootScope.showSearch = false;
    $rootScope.searchResults = [];
    window.location.hash = link.replace('#', '');
  };

  // Current user
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $rootScope.currentUser = user.email;
      $rootScope.$apply();
    }
  });
}]);