const fail = (callback) => callback?.(new Error('Web runtime does not support zlib'))

export const gzip = (_input, callback) => fail(callback)
export const gunzip = (_input, callback) => fail(callback)
export const deflateRaw = (_input, callback) => fail(callback)
export const inflate = (_input, callback) => fail(callback)

export default {
  gzip,
  gunzip,
  deflateRaw,
  inflate,
}
