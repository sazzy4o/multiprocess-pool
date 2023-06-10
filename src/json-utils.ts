const JS_DATE_REGEX = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/

export const jsonUtils = {
  reviver(key: string, value:any) {
    return typeof value === 'string' && JS_DATE_REGEX.test(value) ? new Date(value) : value
  },
  safeStringify(obj: any) {
    return typeof obj !== 'undefined' ? JSON.stringify(obj) : obj
  },
  safeParse(str: string) {
    return typeof str !== 'undefined' ? JSON.parse(str, jsonUtils.reviver) : str
  }
}

export default jsonUtils
