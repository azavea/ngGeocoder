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
            var dfd = $q.defer();
            var self = this;

            var addressText = text;
            angular.forEach(this.options.addressPreprocessors, function (addressPPFunc) {
                addressText = addressPPFunc.call(self, addressText);
            });

            var params = {
                text: addressText
            };
            angular.forEach(this.options.optionsPreprocessors, function (optionsPPFunc) {
                angular.extend(params, optionsPPFunc.call(self, params));
            });

            $http.get(this.options.url, {
                params: params,
            }).then(function (response) {
                angular.forEach(self.options.postprocessors, function (postProcess) {
                    response = postProcess.call(self, response);
                });
                dfd.resolve(response);
            }).catch(function (error) {
                dfd.reject(error);
            });
            return dfd.promise;
        };

        return BaseGeocoder;
    }

    angular.module('azGeocoder')
    .factory('BaseGeocoder', BaseGeocoderFactory);

})();
