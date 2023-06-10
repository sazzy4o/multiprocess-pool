import Job, { JobCallback } from "./job"
import jsonUtils from "./json-utils"
import WorkerWrapper from "./worker-wrapper"
import os from "os"

export class Pool {
  queue: any[]
  closed: boolean
  workers: any[]
  readyWorkers: any[]
  _nextJobId: number
  [key: string]: any
  constructor(numWorkers?: number) {
    numWorkers = numWorkers || os.cpus().length

    this.queue        = []
    this.closed       = false
    this.workers      = Array.from(new Array(numWorkers)).map(() => new WorkerWrapper())
    this.readyWorkers = this.workers.slice()
    this._nextJobId   = 0
  }

  // Prevents any more tasks from being submitted to the pool.
  // Once all the tasks have been completed the worker processes will exit.
  close() {
    this.closed = true
    this.workers.forEach(worker => worker.terminateAfterJobsComplete())
  }

  // Stops the worker processes immediately without completing outstanding work.
  terminate() {
    this.closed = true
    this.workers.forEach(worker => worker.terminateImmediately())
  }

  define(name:string, fnOrModulePath: Function | string, options:any) {
    if (this.hasOwnProperty(name)) {
      throw new Error(`Pool already has a property "${name}"`)
    }
    this[name] = {
      map: (arg:any) => this.map(arg, fnOrModulePath, options),
      apply: (arg:any) => this.apply(arg, fnOrModulePath, options)
    }
  }

  // Applies single argument to a function and returns result via a Promise
  apply(arg:any, fnOrModulePath: Function | string, options: any) {
    return this.map([arg], fnOrModulePath, options).then(res => res[0])
  }

  map(arr: any[], fnOrModulePath: Function|string, options:any): Promise<any[]> {
    return new Promise((resolve, reject) =>
      this._queuePush(arr, fnOrModulePath, options,
        (err:any, data:any) => err ? reject(err) : resolve(data))
    )
  }

  _queuePush(arr: any[], fnOrModulePath: Function|string, options:any, cb: JobCallback) {
    options = options || {}
    const chunksize = typeof options === 'number' ? options : options.chunksize

    if (this.closed) {
      return cb(new Error('Pool has been closed'), null)
    }
    this._assertIsUsableFnOrModulePath(fnOrModulePath)
    if (!arr || !arr.length) {
      return cb(null, [])
    }

    const job = {
      id: this._getNextJobId(),
      arr: arr,
      fnOrModulePath: fnOrModulePath,
      chunksize: chunksize || Math.ceil(arr.length / this.workers.length),
      cb: cb,
      nextIndex: 0,
      options: options
    }
    this._registerJobWithWorkers(job)
    this.queue.push(job)
    this._queueTick()
  }

  _queueTick() {
    while (this.queue.length && this.readyWorkers.length) {
      const job = this.queue[0]
      const chunk = job.arr.slice(job.nextIndex, job.nextIndex + job.chunksize)
      this.readyWorkers.pop().runJob(job.id, job.nextIndex, chunk)
      job.nextIndex += job.chunksize
      if (job.nextIndex >= job.arr.length) {
        this.queue.shift()
      }
    }
  }

  _registerJobWithWorkers(job: Job) {
    const result:any[] = []
    let tasksRemaining = job.arr ? job.arr.length: 0
    let jobTerminated = false
    this.workers.forEach(worker => {
      worker.registerJob(job.id, job.fnOrModulePath, job.options, (err:any, data:any) => {
        this.readyWorkers.push(worker)
        this._queueTick()

        if (jobTerminated) {
          return worker.deregisterJob(job.id)
        }

        if (err) {
          worker.deregisterJob(job.id)
          jobTerminated = true
          return job.cb(err, null)
        }

        result[data.index] = jsonUtils.safeParse(data.result)
        if (job.options && job.options.onResult) {
          job.options.onResult(result[data.index], data.index);
        }
        tasksRemaining -= 1
        if (tasksRemaining <= 0) {
          worker.deregisterJob(job.id)
          return job.cb(null, result)
        }
      })
    })
  }

  _assertIsUsableFnOrModulePath(fnOrModulePath: Function|string) {
    if (typeof fnOrModulePath !== 'function' && typeof fnOrModulePath !== 'string') {
      throw new Error('fnOrModulePath must be a function or a string')
    }
  }

  _getNextJobId() {
    return this._nextJobId++
  }

}

export default Pool