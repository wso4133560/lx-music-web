export const stringify = (value = {}) => new URLSearchParams(value).toString()

export default {
  stringify,
}
