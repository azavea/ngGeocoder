(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Modules
  angular.module('azGeocoder', []);

})(angular);

/**
 * Angular Geocoder abstraction layer
 *
 * BaseGeocoder
 *        Implement concrete versions of the BaseGeocoder for each service you would like to use
 *
 * GeocoderOptions object:
 * @param {String} key API key, if the specific API requires one
 * @param {String} url Url of the geocoder endpoint
 * @param {Array} optionsPreprocessors A set of functions, called in order, used to
 *                                     map a RequestOptions object to the geocoder-specific GET params.
 *                                     `this` is set to the Geocoder instance.
 * @param {Array} addressPreprocessors A set of functions, called in order, used to map text to
 *                                     a geocoder-specific input address. E.g. some geocoders take
 *                                     address components instead of a text string.
 *                                     `this` is set to the Geocoder instance.
 * @param {Array} postprocessors       A set of functions, called in order, used to map the
 *                                     geocoder-specific result to an array of GeocoderResult objects
 *                                     `this` is set to the Geocoder instance.
 *
 * RequestOptions object:
 * TODO: sensible way to structure generic category filtering?
 * @param {Object} categories Object containing category filtering data
 * @param {String} format format of request, usually 'json'
 * @param {Number} limit  Max number of results to return
 * @param {Array} origin Array of [lon, lat] to be used as a sort parameter
 * @param {Number} distance Used with origin to prioritize results
 * @param {Array} extent Array of [xmin,ymin,xmax,ymax] used to bound geocoder results
 * @param {Object} extras   Object of extra data to pass to specific implementations of the Geocoder
 *
 * GeocoderResult object:
 * @param {String} name     Result name
 * @param {Number} score    Score, usually 0-100 on how good the match is
 * @param {String} type     Type of the result, usually a string like 'Postal',
 *                          'POI' or 'Street Address'
 * @param {Object} geometry Object with 'x' and 'y' properties to denote the position of the
 *                          result location
 * @param {Object} extent   Ojbect with 'xmin', 'ymin', 'xmax' and 'ymax' properties to denote
 *                          the extent of the result location
 * @param {Object} extras   An object holding any other geocoder-specific properties returned
 *                          in the original response
 *
 * @return {[type]} [description]
 */
(function () {
    'use strict';

    /* ngInject */
    function BaseGeocoderFactory ($http, $q) {

        var defaults = {
            key: null,
            url: null,
            textParam: 'text',
            optionsPreprocessors: [defaultOptionsPreprocessor],
            addressPreprocessors: [defaultAddressPreprocessor],
            postprocessors: [defaultPostprocessor]
        };

        // No-ops
        function defaultOptionsPreprocessor(options) {
            return options;
        }

        // No-ops
        function defaultAddressPreprocessor(addressText) {
            return addressText;
        }

        function defaultPostprocessor(results) {
            throw 'Abstract. Each Geocoder implementation must have a postprocessor function';
        }

        function BaseGeocoder(options) {
            this.options = angular.extend({}, defaults, options);

            if (!this.options.url) {
                throw 'Geocoder url required';
            }
        }

        /**
         * Geocode a text address
         * @param  {String} text                text to geocode
         * @param  {RequestOptions} options     GeocoderOptions object with commonly used options
         * @param  {[type]} addtlOptions        Additional options object that will be passed directly
         *                                      to the geocoder request
         * @return {$q.deferred}                Promise object resolved with an Array of GeocoderResult objects
         */
        BaseGeocoder.prototype.geocode = function geocode(text, options, addtlOptions) {
            var self = this;

            var addressText = text;
            angular.forEach(this.options.addressPreprocessors, function (addressPPFunc) {
                addressText = addressPPFunc.call(self, addressText);
            });

            var params = angular.extend({}, options, addtlOptions);
            angular.forEach(this.options.optionsPreprocessors, function (optionsPPFunc) {
                angular.extend(params, optionsPPFunc.call(self, params));
            });
            params[this.options.textParam] = addressText;

            return this._request(addressText, params);
        };

        BaseGeocoder.prototype._request = function _request(text, params) {
            var dfd = $q.defer();
            var self = this;

            $http.get(this.options.url, {
                params: params,
            }).then(function (response) {
                dfd.resolve(self._successCallback(response));
            }).catch(function (error) {
                dfd.reject(error);
            });
            return dfd.promise;
        };

        BaseGeocoder.prototype._successCallback = function _successCallback(response) {
            var self = this;
            angular.forEach(this.options.postprocessors, function (postProcess) {
                response = postProcess.call(self, response);
            });
            return response;
        };

        return BaseGeocoder;
    }

    angular.module('azGeocoder')
    .factory('BaseGeocoder', BaseGeocoderFactory);

})();

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

        var esriGeocoder = new BaseGeocoder(options);
        return esriGeocoder;
    }

    angular.module('azGeocoder')
    .service('ESRIGeocoder', ESRIGeocoder);

})();