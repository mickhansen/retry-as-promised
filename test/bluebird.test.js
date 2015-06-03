var chai = require('chai')
  , expect = chai.expect
  , Promise = require('bluebird')
  , retry = require('../');

chai.use(require('chai-as-promised'));

describe('bluebird', function () {
  var count
    , soRejected
    , soResolved;

  beforeEach(function () {
    count = 0;
    soRejected = Math.random().toString();
    soResolved = Math.random().toString();
  });

  it('should reject immediately if max is 1', function () {
    return expect(retry(function () {
      count++;
      return Promise.reject(soRejected);
    }, {
      max: 1
    })).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(count).to.equal(1);
    });
  });

  it('should reject after all tries if still rejected', function () {
    return expect(retry(function () {
      count++;
      return Promise.reject(soRejected);
    }, {
      max: 3
    })).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(count).to.equal(3);
    });
  });

  it('should resolve immediately if resolved on first try', function () {
    return expect(retry(function () {
      count++;
      return Promise.resolve(soResolved);
    }, {
      max: 10
    })).to.eventually.be.equal(soResolved).then(function () {
      expect(count).to.equal(1);
    });
  });

  it('should resolve if resolved before hitting max', function () {
    return expect(retry(function () {
      count++;

      if (count < 4) {
        return Promise.reject(soRejected);
      }

      return Promise.resolve(soResolved);
    }, {
      max: 10
    })).to.eventually.be.equal(soResolved).then(function () {
      expect(count).to.equal(4);
    });
  });
});