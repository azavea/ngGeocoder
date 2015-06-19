(function () {
    'use strict';

    function GeocoderController($log, $scope, ESRIGeocoder) {
        $scope.form = {
            geocodeText: ''
        };
        $scope.locations = [];
        $scope.onGeocodeSubmit = onGeocodeSubmit;

        function onGeocodeSubmit() {
            ESRIGeocoder.geocode($scope.form.geocodeText)
            .then(function (locations) {
                $log.info(locations);
                $scope.locations = locations;
            }).catch(function (error) {
                $log.error(error);
            });
        }
    }

    angular.module('azGeocoderDemo', ['ui.bootstrap', 'azGeocoder'])
    .controller('azGeocoderController', GeocoderController);

})();