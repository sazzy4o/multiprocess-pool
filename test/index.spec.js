'use strict';

var Pool   = require('../').Pool;
var should = require('chai').should();
var P      = require('bluebird');
var _      = require('lodash');

describe('Pool', function () {

  describe('#close', function () {

  });

  describe('#map', function () {

    it('should perform a simple map', function () {
      return new Pool(2).map([1, 2, 3, 4, 5], function (n) {
        return n * 2;
      })
        .then(function (res) {
          should.exist(res);
          res.should.eql([2, 4, 6, 8, 10]);
        });
    });

    it('should perform multiple maps at once', function () {
      var pool = new Pool(2);
      var arr1 = _.range(0, 50);
      var fn1 = function (n) {
        return n * 5;
      };
      var arr2 = _.range(25, 750);
      var fn2 = function (n) {
        return n * 2;
      };
      var arr3 = _.range(1, 4);
      var fn3 = function (n) {
        return n;
      };
      return P.all([
        pool.map(arr1, fn1),
        pool.map(arr2, fn2),
        pool.map(arr3, fn3)
      ])
        .spread(function (res1, res2, res3) {
          res1.should.eql(arr1.map(fn1));
          res2.should.eql(arr2.map(fn2));
          res3.should.eql(arr3.map(fn3));
        });
    });

    it('should handle errors', function () {
      var threwErr = false;
      return new Pool(2).map([1, 2, 3], function (n) {
        if (n === 2) {
          throw new Error('test error');
        }
        return n;
      })
        .catch(function (err) {
          threwErr = true;
          err.should.match(/test error/);
        })
        .finally(function () {
          threwErr.should.be.true;
        });
    });

    it('should work with more workers than items to process', function () {
      return new Pool(6).map([1, 2, 3], function (n) {
        return n * 4;
      })
        .then(function (res) {
          should.exist(res);
          res.should.eql([4, 8, 12]);
        });
    });

    it('should work with a single worker', function () {
      return new Pool(1).map([1, 2, 3], function (n) {
        return n * 4;
      })
        .then(function (res) {
          should.exist(res);
          res.should.eql([4, 8, 12]);
        });
    });

    it('should work with one item in array', function () {
      return new Pool(2).map([1], function (n) {
        return n * 4;
      })
        .then(function (res) {
          should.exist(res);
          res.should.eql([4]);
        });
    });

    it('should work with no items in array', function () {
      return new Pool(2).map([], function (n) {
        return n;
      })
        .then(function (res) {
          should.exist(res);
          res.should.eql([]);
        });
    });

    it('should throw an error if no worker function or module provided', function () {
      (function () {
        return new Pool(2).map([1], 123);
      }).should.throw(/fnOrModulePath must be a function or a string/);
    });

  });

  describe('#apply', function () {

    it('should be a convenience method for running map with a single argument', function () {
      return new Pool(2).apply(5, function (n) {
        return n * 10;
      })
        .then(function (res) {
          should.exist(res);
          res.should.equal(50);
        });
    });

    it('should be able handle simultaneous calls', function () {
      var fn = function (n) {
        return n * 10;
      };
      var pool = new Pool(2);
      return P.all([
        pool.apply(1, fn),
        pool.apply(2, fn),
        pool.apply(3, fn),
        pool.apply(4, fn),
        pool.apply(5, fn),
        pool.map([6], fn)
      ])
        .then(function (results) {
          results.should.eql([10, 20, 30, 40, 50, [60]]);
        });
    });

  });


});
