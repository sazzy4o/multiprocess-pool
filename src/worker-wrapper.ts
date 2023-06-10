import { ChildProcess, fork } from 'child_process'
import jsonUtils from './json-utils'
import Job, { JobCallback } from './job'

const allWorkers:WorkerWrapper[] = []
process.on('exit', () => allWorkers.forEach(worker => worker.process.kill()))

function makeError(errorMsg:string, stack:any) {
  const err = new Error(errorMsg)
  err.stack = stack
  return err
}

export default class WorkerWrapper {
  process!: ChildProcess
  timeout?: string | number | NodeJS.Timeout
  runningJobs: number
  terminated: boolean
  registeredJobs: { [key: number]: Job }
  fnOrModulePaths: { [key: string]: string | Function }

  constructor() {
    this.runningJobs = 0
    this.terminated = false
    this.registeredJobs = {}
    this.fnOrModulePaths = {}
    this.timeout = undefined

    this.startWorkerProcess()
    allWorkers.push(this)
  }

  startWorkerProcess() {
    this.process = fork(`${__dirname}/worker.js`)
    for (const regJobId in this.registeredJobs) {
      if (this.registeredJobs[regJobId]) {
        const job = this.registeredJobs[regJobId]
        this.registerJob(parseInt(regJobId, 10), job.fnOrModulePath, job.callback)
      }
    }
    this.process.on('message', (data: any) => {
      const job = this.registeredJobs[data.jobId]
      if (job.terminated) { return }

      clearTimeout(this.timeout)
      let err = null
      if (data.error) {
        err = makeError(data.error, data.stack)
      }
      if (job.callback) {
        job.callback(err, data)
      }
      if (data.jobDone) {
        this.runningJobs -= 1
      } else if (job.timeout > 0) {
        this.startJobTimeout(job)
      }
      if (this.terminated && this.runningJobs === 0) {
        this.process.disconnect()
      }
    })
  }

  runJob(jobId: number, index: number, argList: any[]) {
    if (this.terminated) { return }  // TODO: should this be an error?

    this.process.send({
      jobId   : jobId,
      index   : index,
      argList : jsonUtils.safeStringify(argList)
    })
    this.runningJobs += 1

    const job = this.registeredJobs[jobId]
    if (job.timeout > 0) {
      this.startJobTimeout(job)
    }
  }

  registerJob(jobId: number, fnOrModulePath: Function | string, options: any, callback?: JobCallback) {
    const timeout = (options ? options.timeout : null) || -1

    if (this.terminated) { return }  // TODO: should this be an error?

    this.registeredJobs[jobId] = {callback, fnOrModulePath, timeout, options, id: jobId}
    const modulePath = typeof fnOrModulePath === 'string' ? fnOrModulePath : null
    const fnStr = typeof fnOrModulePath === 'function' ? fnOrModulePath.toString() : null
    this.process.send({
      jobId      : jobId,
      modulePath : modulePath,
      fnStr      : fnStr
    })
  }

  deregisterJob(jobId: number) {
    if (this.terminated) { return }  // TODO: should this be an error?

    delete this.registeredJobs[jobId]
    this.process.send({
      jobId         : jobId,
      deregisterJob : true
    })
  }

  terminateImmediately() {
    this.terminated = true
    this.process.disconnect()
    for (const cbName in this.registeredJobs) {
      if (this.registeredJobs[cbName]) {
        const callback = this.registeredJobs[cbName].callback
        if (callback) {
          callback(new Error('Pool was closed'), null)
        }
      }
    }
  }

  terminateAfterJobsComplete() {
    this.terminated = true
    if (this.runningJobs === 0) {
      this.process.disconnect()
    }
  }

  startJobTimeout(job: Job) {
    this.timeout = setTimeout(() => {
      job.terminated = true
      this.process.kill()
      this.startWorkerProcess()
      if (job.callback){
        job.callback(new Error('Task timed out'), null)
      }
    }, job.timeout)
  }

}
