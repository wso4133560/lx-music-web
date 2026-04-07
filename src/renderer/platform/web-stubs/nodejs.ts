import md5 from 'crypto-js/md5'

const splitPath = (input: string) => input.split(/[\\/]+/).filter(Boolean)

export const joinPath = (...paths: string[]): string => {
  const normalized = paths
    .filter(Boolean)
    .map(path => path.replace(/\\/g, '/'))
  return normalized.join('/').replace(/\/{2,}/g, '/')
}

export const extname = (input: string): string => {
  const name = splitPath(input).pop() ?? ''
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(index) : ''
}

export const basename = (input: string, ext = ''): string => {
  const name = splitPath(input).pop() ?? ''
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name
}

export const dirname = (input: string): string => {
  const parts = splitPath(input)
  parts.pop()
  return parts.join('/')
}

export const checkPath = async(_path: string): Promise<boolean> => false
export const checkAndCreateDir = async(_path: string) => false
export const getFileStats = async(_path: string): Promise<any> => null
export const createDir = async(_path: string) => {}
export const removeFile = async(_path: string) => {}

export const readFile = async(_path: string) => {
  throw new Error('Web runtime does not support local file reads')
}

export const toMD5 = (str: string) => md5(str).toString()

export const gzipData = async(_str: string): Promise<Uint8Array> => {
  throw new Error('Web runtime does not support gzip export')
}

export const gunzipData = async(_buf: Uint8Array): Promise<string> => {
  throw new Error('Web runtime does not support gzip import')
}

export const saveLxConfigFile = async(_path: string, _data: any) => {
  throw new Error('Web runtime does not support config file export')
}

export const readLxConfigFile = async(_path: string): Promise<any> => {
  throw new Error('Web runtime does not support config file import')
}

export const saveStrToFile = async(_path: string, _str: string | Uint8Array): Promise<void> => {
  throw new Error('Web runtime does not support file export')
}

export const b64DecodeUnicode = (str: string): string => {
  if (typeof atob == 'function') return atob(str)
  return Buffer.from(str, 'base64').toString()
}

export const copyFile = async(_sourcePath: string, _distPath: string) => {
  throw new Error('Web runtime does not support local file copy')
}

export const moveFile = async(_sourcePath: string, _distPath: string) => {
  throw new Error('Web runtime does not support local file move')
}

export const getAddress = (): string[] => []
