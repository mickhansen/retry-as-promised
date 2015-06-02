module.exports = function(callback, options) {
  if (!callback || !options) throw new Error('retry-as-promised must be passed a callback and a options set or an integer');

  if (typeof options === 'integer') {
    options = {max: options};
  }

  options.$current = 1;

  return callback().then(null, function (err) {
    if (options.$current === options.max) throw err;
    options.$current++;
    return module.exports(callback, options);
  });
};
