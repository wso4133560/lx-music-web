import { isWebRuntime } from './runtime'

const createUnsupportedError = (feature: string) => new Error(`${feature} is not supported in web runtime`)

export const createLocalMusicInfos = async(filePaths: string[]) => {
  if (isWebRuntime) return []
  return window.lx.worker.main.createLocalMusicInfos(filePaths)
}

export const convertLangS2t = async(str: string) => {
  if (isWebRuntime) return str
  return window.lx.worker.main.langS2t(Buffer.from(str).toString('base64')).then((b64: string) => Buffer.from(b64, 'base64').toString())
}

export const readConfigFile = async(path: string) => {
  if (isWebRuntime) throw createUnsupportedError('Read config file')
  return window.lx.worker.main.readLxConfigFile(path)
}

export const saveConfigFile = async(path: string, data: any) => {
  if (isWebRuntime) throw createUnsupportedError('Save config file')
  await window.lx.worker.main.saveLxConfigFile(path, data)
}

export const exportPlayListToText = async(
  savePath: string,
  lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>,
  isMerge: boolean,
) => {
  if (isWebRuntime) throw createUnsupportedError('Export playlist to text')
  await window.lx.worker.main.exportPlayListToText(savePath, lists, isMerge)
}

export const exportPlayListToCSV = async(
  savePath: string,
  lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>,
  isMerge: boolean,
  header: string,
) => {
  if (isWebRuntime) throw createUnsupportedError('Export playlist to csv')
  await window.lx.worker.main.exportPlayListToCSV(savePath, lists, isMerge, header)
}

export const getMusicFilePic = async(filePath: string) => {
  if (isWebRuntime) return null
  return window.lx.worker.main.getMusicFilePic(filePath)
}

export const getMusicFileLyric = async(filePath: string): Promise<LX.Music.LyricInfo | null> => {
  if (isWebRuntime) return null
  return window.lx.worker.main.getMusicFileLyric(filePath)
}
