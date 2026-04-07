import {
  getSystemFonts as getDesktopSystemFonts,
  openSaveDir,
  openDirInExplorer as openDesktopDirInExplorer,
  setPowerSaveBlocker as setDesktopPowerSaveBlocker,
  setWindowSize as setDesktopWindowSize,
  showSelectDialog,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const getAvailableSystemFonts = async() => {
  if (isWebRuntime) return []
  return (await getDesktopSystemFonts()) ?? []
}

export const selectDirectory = async({ title, defaultPath }: { title: string, defaultPath?: string }) => {
  if (isWebRuntime) {
    return {
      canceled: true,
      filePaths: [],
    }
  }
  return showSelectDialog({
    title,
    defaultPath,
    properties: ['openDirectory'],
  })
}

export const selectFiles = async(options: {
  title: string
  filters?: Electron.FileFilter[]
  properties?: Electron.OpenDialogOptions['properties']
}) => {
  if (isWebRuntime) {
    return {
      canceled: true,
      filePaths: [],
    }
  }
  return showSelectDialog({
    title: options.title,
    filters: options.filters,
    properties: options.properties ?? ['openFile'],
  })
}

export const selectSaveFile = async(options: {
  title: string
  defaultPath?: string
  filters?: Electron.FileFilter[]
}) => {
  if (isWebRuntime) {
    return {
      canceled: true,
      filePath: '',
    }
  }
  return openSaveDir({
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters,
  })
}

export const revealInFileManager = async(path: string) => {
  if (isWebRuntime) return
  await openDesktopDirInExplorer(path)
}

export const setPlatformWindowSize = (width: number, height: number) => {
  if (isWebRuntime) return
  setDesktopWindowSize(width, height)
}

export const setPlatformPowerSaveBlocker = (enabled: boolean) => {
  if (isWebRuntime) return
  setDesktopPowerSaveBlocker(enabled)
}
