export const lookup = (hostname, options, callback) => {
  if (typeof options == 'function') callback = options
  queueMicrotask(() => {
    callback?.(new Error(`DNS lookup is unavailable in web runtime: ${hostname}`))
  })
}

export default {
  lookup,
}
