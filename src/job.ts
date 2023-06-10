export type JobCallback = (err: Error | null, data: any) => void
export interface Task {
    args: [any,any,Function|string]
    resolve: (value?: any) => void
    reject: (reason?: any) => void
}
export interface Job {
    callback?: JobCallback
    terminated?: boolean
    timeout?: any
    options: any
    id: number
    fnOrModulePath: Function|string
    chunksize?: number
    cb?: any,
    nextIndex?: number,
    arr?: any[]
}
export default Job