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
  return getDesktopSystemFonts()
}

export const selectDirectory = async({ title, defaultPath }: { title: string, defaultPath?: string }) => {
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
