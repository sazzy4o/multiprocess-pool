import Pool from './pool'
import Heap from './heap'
import {Task} from './job'

export class PriorityQueue {
  numReadyWorkers: number
  pool: Pool
  heap: Heap

  constructor(numWorkers: number) {
    this.numReadyWorkers = numWorkers
    this.pool = new Pool(numWorkers)
    this.heap = new Heap()
  }

  push(arg:any, priority:number, fnOrModulePath: Function|string, options: any) {
    return new Promise((resolve, reject) => {
      this.heap.insert(priority, {
        args: [arg, fnOrModulePath, options],
        resolve: resolve,
        reject: reject
      })
      this._tick()
    })
  }

  _tick() {
    while (this.numReadyWorkers && this.heap.len) {
      this.numReadyWorkers -= 1
      this._processTask(this.heap.popMax().data)
    }
  }

  _processTask(task: Task) {
    this.pool.apply(...task.args)
      .then(task.resolve, task.reject)
      .then(() => {
        this.numReadyWorkers += 1
        this._tick()
      })
  }

}

export default PriorityQueue