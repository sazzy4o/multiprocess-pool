import jsonUtils from './json-utils'
import Job from './job'

const jobFns:any = {}
const isPromise = (obj:any) => obj && typeof obj.then === 'function'

// Prevent zombie processes🧟
process.on('disconnect', function() {
  process.exit();
});
process.on('error', function( err ) {
  if (err.code == "EPIPE") {
      process.exit(0);
  }
});

function processData(argList: any[], jobId: number, index:number) {
  function sendErr(err: Error) {
    if (process.send === undefined) {
      throw new Error('Must be run as a child process')
    }
    process.send({
      jobId: jobId,
      error: err.message,
      stack: err.stack
    })
  }
  function sendSucess(res:any, offset:number) {
    if (process.send === undefined) {
      throw new Error('Must be run as a child process')
    }
    process.send({
      jobId   : jobId,
      index   : index + offset,
      result  : jsonUtils.safeStringify(res),
      jobDone : offset === argList.length - 1
    })
  }
  function handlePromise(promise: Promise<any>, offset: number) {
    return promise.then(res => sendSucess(res, offset), sendErr)
  }

  try {
    const fn = jobFns[jobId]
    argList.forEach((args, offset) => {
      const res = fn(args)
      return isPromise(res) ? handlePromise(res, offset) : sendSucess(res, offset)
    })
  } catch (err: any) {
    return sendErr(err)
  }
}

process.on('message', (data: any) => {
  if (data.argList) {
    processData(jsonUtils.safeParse(data.argList), data.jobId, data.index)
  }
  if (data.deregisterJob) {
    delete jobFns[data.jobId]
    return
  }
  if (data.modulePath) {
    jobFns[data.jobId] = require(data.modulePath)
  }
  if (data.fnStr) {
    let fn
    eval('fn =' + data.fnStr)  // eslint-disable-line
    jobFns[data.jobId] = fn
  }
})
