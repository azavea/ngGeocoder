(function () {
    'use strict';

    /* ngInject */
    function GoogleGeocoderFactory($log, $q, BaseGeocoder) {

        if (!(google && google.maps && google.maps.Geocoder)) {
            $log.error('GoogleGeocoder requires the google maps javascript v3 API!');
            return {};
        }

        function googleOptionsPreprocessor(options) {
            var esriOptions = {
                f: options.format || 'json',
                bbox: options.extent ? options.extent.join(',') : null,
                location: options.origin ? options.origin.join(',') : null,
                distance: options.distance || null,
                maxLocations: options.limit || null
            };
            return esriOptions;
        }

        function googlePostprocessor(locations, status) {
            var geocoderResults = [];
            angular.forEach(locations, function (esriLocation) {
                var location = {
                    name: esriLocation.name,
                    extent: esriLocation.extent || null,
                    geometry: esriLocation.feature.geometry || null,
                    score: esriLocation.feature.attributes ? esriLocation.feature.attributes.Score : null,
                    /* jshint camelcase: false */
                    type: esriLocation.feature.attributes ? esriLocation.feature.attributes.Addr_Type : null
                    /* jshint camelcase: true */
                };
                geocoderResults.push(location);
            });
            return geocoderResults;
        }

        var options = {
            url: 'https://developers.google.com/maps/documentation/javascript/reference#Geocoder',
            textField: 'address',
            optionsPreprocessors: [googleOptionsPreprocessor],
            postprocessors: [googlePostprocessor]
        };
        var geocoder = new google.maps.Geocoder();

        function GoogleGeocoder() {}

        GoogleGeocoder.prototype = BaseGeocoder;
        GoogleGeocoder.prototype._request = function _request(addressText, params) {
            var self = this;
            var dfd = $q.defer();
            var request = angular.extend({}, params, { address: addressText });
            geocoder.geocode(request, function (locations, status) {
                locations = this._successCallback(locations);
                dfd.resolve(locations);
            });
            return dfd.promise;
        };

        var googleGeocoder = new GoogleGeocoder();
        googleGeocoder.setOptions(options);
        return googleGeocoder;
    }

    angular.module('azGeocoder')
    .service('GoogleGeocoder', GoogleGeocoderFactory);

})();