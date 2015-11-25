var chai = require('chai')
  , expect = chai.expect
  , Promise = require('bluebird')
  , moment = require('moment')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , retry = require('../');

chai.use(require('chai-as-promised'));
require('sinon-as-promised')(Promise);

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
      max: 1,
      backoffBase: 0
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
      max: 3,
      backoffBase: 0
    })).to.eventually.be.rejectedWith(soRejected).then(function () {
      expect(count).to.equal(3);
    });
  });

  it('should resolve immediately if resolved on first try', function () {
    return expect(retry(function () {
      count++;
      return Promise.resolve(soResolved);
    }, {
      max: 10,
      backoffBase: 0
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
      max: 10,
      backoffBase: 0
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
        backoffBase: 0,
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
        backoffBase: 0,
        timeout: 1500
      })).to.eventually.be.rejectedWith(Promise.TimeoutError).then(function () {
        expect(count).to.equal(3);
      });
    });
  });
  
  describe('match', function () {
    it('should continue retry while error is equal to match string', function () {
      return expect(retry(function () {
        count++;

        if (count < 4) {
          return Promise.reject(soRejected);
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15,
        backoffBase: 1,
        match: soRejected
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(4);
      });
    });
    
    it('should reject immediately if error is not equal to match string', function () {
      return expect(retry(function () {
        count++;

        return Promise.reject(soRejected);
      }, {
        max: 15,
        backoffBase: 1,
        match: "A custom error string"
      })).to.eventually.be.rejectedWith(soRejected).then(function () {
        expect(count).to.equal(1);
      });
    });
    
    it('should continue retry while error is instanceof match', function () {
      return expect(retry(function () {
        count++;

        if (count < 4) {
          return Promise.reject(new Error(soRejected));
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15,
        backoffBase: 1,
        match: Error
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(4);
      });
    });

    it('should reject immediately if error is not instanceof match', function () {
      return expect(retry(function () {
        count++;

        return Promise.reject(new Error(soRejected));
      }, {
        max: 15,
        backoffBase: 1,
        match: function foo(){},
      })).to.eventually.be.rejectedWith(Error).then(function () {
        expect(count).to.equal(1);
      });
    });
    
    it('should continue retry while error is instanceof match', function () {
      return expect(retry(function () {
        count++;

        if (count < 4) {
          return Promise.reject(new Error(soRejected));
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15,
        backoffBase: 1,
        match: Error
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(4);
      });
    });
    
    it('should continue retry while error is equal to match string in array', function () {
      return expect(retry(function () {
        count++;

        if (count < 4) {
          return Promise.reject(soRejected);
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15,
        backoffBase: 1,
        match: [soRejected + 1, soRejected]
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(4);
      });
    });

    it('should reject immediately if error is not equal to match string in array', function () {
      return expect(retry(function () {
        count++;

        return Promise.reject(soRejected);
      }, {
        max: 15,
        backoffBase: 1,
        match: [soRejected + 1, soRejected + 2]
      })).to.eventually.be.rejectedWith(soRejected).then(function () {
        expect(count).to.equal(1);
      });
    });

    it('should reject immediately if error is not instanceof match in array', function () {
      return expect(retry(function () {
        count++;

        return Promise.reject(new Error(soRejected));
      }, {
        max: 15,
        backoffBase: 1,
        match: [soRejected + 1, function foo(){}],
      })).to.eventually.be.rejectedWith(Error).then(function () {
        expect(count).to.equal(1);
      });
    });

    it('should continue retry while error is instanceof match in array', function () {
      return expect(retry(function () {
        count++;

        if (count < 4) {
          return Promise.reject(new Error(soRejected));
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15,
        backoffBase: 1,
        match: [soRejected + 1, Error]
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(4);
      });
    });
  });

  describe('backoff', function () {
    it('should resolve after 10 retries and an eventual delay over 1.2 seconds using default backoff', function () {
      var startTime = moment();
      return expect(retry(function () {
        count++;

        if (count < 10) {
          return Promise.reject(soRejected);
        }

        return Promise.resolve(soResolved);
      }, {
        max: 15
      })).to.eventually.be.equal(soResolved).then(function () {
        expect(count).to.equal(10);
        expect(moment().diff(startTime)).to.be.above(1200);
      });
    });
    
    it('should throw TimeoutError and cancel backoff delay if timeout is reached', function () {
      return expect(retry(function () {
        return Promise.delay(2000);
      }, {
        max: 15,
        backoffBase: 0,
        timeout: 1000
      })).to.eventually.be.rejectedWith(Promise.TimeoutError);
    });
  });
});
