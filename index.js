'use strict';

var Promise = require('any-promise');
var util = require('util');
var format = util.format;

function TimeoutError(message) {
  Error.call(this);
  Error.captureStackTrace(this, TimeoutError);
  this.name = 'TimeoutError';
  this.message = message;
}

util.inherits(TimeoutError, Error);

module.exports = function retryAsPromised(callback, options) {
  if (!callback || !options) {
    throw new Error(
      'retry-as-promised must be passed a callback and a options set or a number'
    );
  }

  if (typeof options === 'number') {
    options = {
      max: options
    };
  }

  // Super cheap clone
  options = {
    $current: options.$current || 1,
    max: options.max,
    timeout: options.timeout || undefined,
    match: options.match || [],
    backoffBase: options.backoffBase === undefined ? 100 : options.backoffBase,
    backoffExponent: options.backoffExponent || 1.1,
    report: options.report || null,
    name: options.name || callback.name || 'unknown'
  };

  var report = options.report;

  // Massage match option into array so we can blindly treat it as such later
  if (!Array.isArray(options.match)) options.match = [options.match];

  if (report) {
    report(format('Trying %s #%s at %s ', options.name, options.current, new Date().toLocaleTimeString()), options);
  }

  return new Promise(function(resolve, reject) {
    var timeout, backoffTimeout;

    if (options.timeout) {
      timeout = setTimeout(function() {
        if (backoffTimeout) clearTimeout(backoffTimeout);
        reject(new TimeoutError(options.name + ' timed out'));
      }, options.timeout);
    }

    Promise.resolve(callback({ current: options.$current }))
      .then(resolve)
      .then(function() {
        if (timeout) clearTimeout(timeout);
        if (backoffTimeout) clearTimeout(backoffTimeout);
      })
      .catch(function(err) {
        if (timeout) clearTimeout(timeout);
        if (backoffTimeout) clearTimeout(backoffTimeout);

        if (report) {
            report((err && err.toString()) || err, options);
        }

        // Should not retry if max has been reached
        var shouldRetry = options.$current < options.max;

        if (shouldRetry && options.match.length && err) {
          // If match is defined we should fail if it is not met
          shouldRetry = options.match.reduce(function(shouldRetry, match) {
            if (shouldRetry) return shouldRetry;

            if (
              match === err.toString() ||
              match === err.message ||
              (typeof match === 'function' && err instanceof match) ||
              (match instanceof RegExp &&
                (match.test(err.message) || match.test(err.toString())))
            ) {
              shouldRetry = true;
            }
            return shouldRetry;
          }, false);
        }

        if (!shouldRetry) return reject(err);

        var retryDelay = Math.pow(
          options.backoffBase,
          Math.pow(options.backoffExponent, options.$current - 1)
        );

        // Do some accounting
        options.$current++;
        if (report) {
          report(format('Retrying %s (%s)', options.name, options.$current), options);
        }
        if (retryDelay) {
          // Use backoff function to ease retry rate
          if (report) {
            report(format('Delaying retry of %s by %s', options.name, retryDelay), options);
          }
          backoffTimeout = setTimeout(function() {
            retryAsPromised(callback, options)
              .then(resolve)
              .catch(reject);
          }, retryDelay);
        } else {
          retryAsPromised(callback, options)
            .then(resolve)
            .catch(reject);
        }
      });
  });
};

module.exports.TimeoutError = TimeoutError;
