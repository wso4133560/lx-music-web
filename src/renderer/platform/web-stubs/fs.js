const fail = async() => {
  throw new Error('Web runtime does not support fs access')
}

export const constants = {
  F_OK: 0,
  W_OK: 0,
}

export const promises = {
  access: fail,
  mkdir: fail,
  readFile: fail,
  copyFile: fail,
  rename: fail,
}

export const access = (_path, _mode, callback) => callback?.(new Error('Web runtime does not support fs access'))
export const stat = (_path, callback) => callback?.(new Error('Web runtime does not support fs stat'))
export const unlink = (_path, callback) => callback?.(new Error('Web runtime does not support fs unlink'))
export const writeFile = (_path, _data, _options, callback) => {
  if (typeof _options == 'function') _options(new Error('Web runtime does not support fs writeFile'))
  else callback?.(new Error('Web runtime does not support fs writeFile'))
}
export const createReadStream = () => {
  throw new Error('Web runtime does not support fs streams')
}
export const createWriteStream = () => {
  throw new Error('Web runtime does not support fs streams')
}

export default {
  constants,
  promises,
  access,
  stat,
  unlink,
  writeFile,
  createReadStream,
  createWriteStream,
}
