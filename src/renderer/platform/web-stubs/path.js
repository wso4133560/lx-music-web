const splitPath = input => input.split(/[\\/]+/).filter(Boolean)

export const join = (...paths) => paths.filter(Boolean).join('/').replace(/\/{2,}/g, '/')
export const extname = input => {
  const name = splitPath(input).pop() ?? ''
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(index) : ''
}
export const basename = (input, ext = '') => {
  const name = splitPath(input).pop() ?? ''
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name
}
export const dirname = input => {
  const parts = splitPath(input)
  parts.pop()
  return parts.join('/')
}

export default {
  join,
  extname,
  basename,
  dirname,
}
