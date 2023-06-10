import {Heap} from '../'
import _ from 'lodash'
import chai from 'chai'

// const Heap   = require('../').Heap
// const chai   = require('chai')
// const _      = require('lodash')

const should = chai.should()

describe('Heap', function () {

  it('should be a max heap', function () {
    const arr  = _.range(1000).map(_.random.bind(_, 0, 1000000, false))
    const heap = new Heap()
    arr.forEach(function (elem) {
      heap.insert(elem,1)
    })
    const arrFromHeap = [] as number[]
    while (heap.len) {
      arrFromHeap.push(heap.popMax().elem)
    }

    const sortedArr = _.sortBy(arr).reverse()
    arrFromHeap.should.eql(sortedArr)
  })

  it('should insert items with data', function () {
    const heap = new Heap()
    should.not.exist(heap.popMax())

    heap.insert(40, 'O')
    heap.insert(50, 'Hell')
    heap.insert(20, '!')
    heap.insert(30, 'World')

    heap.popMax().data.should.equal('Hell')
    heap.popMax().data.should.equal('O')
    heap.popMax().data.should.equal('World')
    heap.popMax().data.should.equal('!')
    should.not.exist(heap.popMax())
  })

  it('should maintain ordering and elements during inserts and pop max', function () {
    const arr  = _.range(1000).map(_.random.bind(_, 0, 1000000, false))
    const heap = new Heap()
    for (let i = 0; i < 500; i++) {
      heap.insert(arr[i], 2)
    }
    const removed = [] as number[]
    for (let i = 0; i < 250; i++) {
      removed.push(heap.popMax().elem)
    }
    for (let i = 500; i < arr.length; i++) {
      heap.insert(arr[i], 3)
    }
    removed.forEach(function (elem) {
      heap.insert(elem, 4)
    })

    const arrFromHeap = [] as number[]
    while (heap.len) {
      arrFromHeap.push(heap.popMax().elem)
    }

    const sortedArr = _.sortBy(arr).reverse()
    arrFromHeap.should.eql(sortedArr)
  })

})

after(async () => {  
  process.exit(0)
})