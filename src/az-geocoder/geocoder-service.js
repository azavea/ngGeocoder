(function () {
    'use strict';

    /* ngInject */
    function GeocoderFactory() {
        var module = {

        };

        return module;
    }

    angular.module('azGeocoder')
    .service('Geocoder', GeocoderFactory);

})();
