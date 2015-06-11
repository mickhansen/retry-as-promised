var debug = require('debug')('retry-as-promised')
  , error = require('debug')('retry-as-promised:error')
  , Promise = require('bluebird');

module.exports = function(callback, options) {
  if (!callback || !options) throw new Error('retry-as-promised must be passed a callback and a options set or a number');

  if (typeof options === 'number') {
    options = {max: options};
  }

  // Super cheap clone
  options = {
    $current: options.$current || 1,
    max: options.max,
    timeout: options.timeout || undefined
  };

  debug('Trying '+callback.name+' (%s)', options.$current);


  return new Promise(function (resolve, reject) {
    var timeout;
    if (options.timeout) {
      timeout = setTimeout(function () {
        reject(Promise.TimeoutError(callback.name + ' timed out'));
      }, options.timeout);
    }

    Promise.resolve(callback()).then(resolve).tap(function () {
      if (timeout) clearTimeout(timeout);
    }).catch(function (err) {
      if (timeout) clearTimeout(timeout);

      error(err && err.toString() || err);
      if (options.$current === options.max) return reject(err);

      options.$current++;
      module.exports(callback, options).then(resolve).catch(reject);
    });
  });
};
