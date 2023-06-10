
// import {PriorityQueue} from '../dist/index.js'
// import chai from 'chai'
// import chaiAsPromised from 'chai-as-promised'
const PriorityQueue = require('../').PriorityQueue
const chai          = require('chai')
const chaiAsPromised = require('chai-as-promised')

const should        = chai.should()

chai.use(chaiAsPromised)

describe('Priority Queue', function () {

  it('should process items', function () {
    const pq = new PriorityQueue(2)
    const fn = function (n) { return n * 2 }

    return Promise.all([
      pq.push(1, 10, fn),
      pq.push(2, 20, fn),
      pq.push(3, 10, fn)
    ])
      .then(function ([res1, res2, res3]) {
        should.exist(res1)
        should.exist(res2)
        should.exist(res3)

        res1.should.equal(2)
        res2.should.equal(4)
        res3.should.equal(6)
      })
  })

  it('should process items in order with only 1 worker', function () {
    const pq = new PriorityQueue(1)
    const fn = function (n) { return n }
    const res = []
    return Promise.all([
      pq.push(1, 10, fn).then(res.push.bind(res)),
      pq.push(3, 30, fn).then(res.push.bind(res)),
      pq.push(7, 70, fn).then(res.push.bind(res)),
      pq.push(2, 20, fn).then(res.push.bind(res)),
      pq.push(4, 40, fn).then(res.push.bind(res)),
      pq.push(6, 60, fn).then(res.push.bind(res)),
      pq.push(5, 50, fn).then(res.push.bind(res)),
      pq.push(8, 80, fn).then(res.push.bind(res))
    ])
      .then(function () {
        // task 1 gets kicked off before the others start, so it should show up
        // first even with the lowest priority
        res.should.eql([1, 8, 7, 6, 5, 4, 3, 2])
      })
  })

})
