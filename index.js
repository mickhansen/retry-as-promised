var debug = require('debug')('retry-as-promised')
  , error = require('debug')('retry-as-promised:error');

module.exports = function(callback, options) {
  if (!callback || !options) throw new Error('retry-as-promised must be passed a callback and a options set or an integer');

  if (typeof options === 'integer') {
    options = {max: options};
  }

  // Super cheap clone
  options = {
    $current: options.$current || 1,
    max: options.max
  };

  debug('Trying '+callback.name+' (%s)', options.$current);

  return callback().then(null, function (err) {
    error(err && err.toString() || err);
    if (options.$current === options.max) throw err;
    options.$current++;
    return module.exports(callback, options);
  });
};
