const fail = async() => {
  throw new Error('Web runtime does not support fs/promises access')
}

export const readFile = fail
export const copyFile = fail
export const rename = fail
export const mkdir = fail
export const access = fail

export default {
  readFile,
  copyFile,
  rename,
  mkdir,
  access,
}
