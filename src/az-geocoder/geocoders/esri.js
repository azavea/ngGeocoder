(function () {
    'use strict';

    /* ngInject */
    function ESRIGeocoder(BaseGeocoder) {

        function esriOptionsPreprocessor(options) {
            var esriOptions = {
                f: options.format || 'json',
                bbox: options.extent ? options.extent.join(',') : null,
                location: options.origin ? options.origin.join(',') : null,
                distance: options.distance || null,
                maxLocations: options.limit || null
            };
            return esriOptions;
        }

        function resultsPostprocessor(results) {
            return results && results.data && results.data.locations ? results.data.locations : [];
        }

        function esriPostprocessor(locations) {
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
            url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find',
            optionsPreprocessors: [esriOptionsPreprocessor],
            postprocessors: [resultsPostprocessor, esriPostprocessor]
        };

        var esriGeocoder = new BaseGeocoder();
        esriGeocoder.setOptions(options);
        return esriGeocoder;
    }

    angular.module('azGeocoder')
    .service('ESRIGeocoder', ESRIGeocoder);

})();