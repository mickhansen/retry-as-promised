var chai = require('chai')
  , expect = chai.expect
  , Promise = require('bluebird')
  , sinon = require('sinon')
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

  it('should reject immediately if max is 1 (using options)', function () {
    return expect(retry(function () {
      count++;
      return Promise.reject(soRejected);
    }, {
      max: 1
    })).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(count).to.equal(1);
    });
  });

  it('should reject immediately if max is 1 (using integer)', function () {
    return expect(retry(function () {
      count++;
      return Promise.reject(soRejected);
    }, 1)).to.eventually.be.rejectedWith(soRejected).then(function () {
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

  describe('timeout', function () {
    it('should throw if reject on first attempt', function () {
      return expect(retry(function () {
        return Promise.delay(2000);
      }, {
        max: 1,
        timeout: 1000
      })).to.eventually.be.rejectedWith(Promise.TimeoutError);
    });

    it('should throw if reject on last attempt', function () {
      return expect(retry(function () {
        count++;
        if (count === 3) {
          return Promise.delay(3500);
        }
        return Promise.reject();
      }, {
        max: 3,
        timeout: 1500
      })).to.eventually.be.rejectedWith(Promise.TimeoutError).then(function () {
        expect(count).to.equal(3);
      });
    });
  });
});