import {
  checkUpdate as checkDesktopUpdate,
  downloadUpdate as downloadDesktopUpdate,
  getIgnoreVersion as getDesktopIgnoreVersion,
  getLastStartInfo as getDesktopLastStartInfo,
  onUpdateAvailable as onDesktopUpdateAvailable,
  onUpdateDownloaded as onDesktopUpdateDownloaded,
  onUpdateError as onDesktopUpdateError,
  onUpdateNotAvailable as onDesktopUpdateNotAvailable,
  onUpdateProgress as onDesktopUpdateProgress,
  quitUpdate as quitDesktopUpdate,
  saveIgnoreVersion as saveDesktopIgnoreVersion,
  saveLastStartInfo as saveDesktopLastStartInfo,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const checkRuntimeUpdate = () => {
  if (isWebRuntime) return
  checkDesktopUpdate()
}

export const downloadRuntimeUpdate = () => {
  if (isWebRuntime) return
  downloadDesktopUpdate()
}

export const quitRuntimeUpdate = () => {
  if (isWebRuntime) return
  quitDesktopUpdate()
}

export const getRuntimeIgnoreVersion = async() => {
  return getDesktopIgnoreVersion()
}

export const saveRuntimeIgnoreVersion = (version: string | null) => {
  saveDesktopIgnoreVersion(version as string)
}

export const getRuntimeLastStartInfo = async() => {
  return getDesktopLastStartInfo()
}

export const saveRuntimeLastStartInfo = (version: string) => {
  saveDesktopLastStartInfo(version)
}

export const subscribeRuntimeUpdateAvailable = (listener: LX.IpcRendererEventListenerParams<any>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUpdateAvailable(listener)
}

export const subscribeRuntimeUpdateNotAvailable = (listener: LX.IpcRendererEventListenerParams<any>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUpdateNotAvailable(listener)
}

export const subscribeRuntimeUpdateError = (listener: LX.IpcRendererEventListenerParams<string>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUpdateError(listener)
}

export const subscribeRuntimeUpdateProgress = (listener: LX.IpcRendererEventListenerParams<any>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUpdateProgress(listener)
}

export const subscribeRuntimeUpdateDownloaded = (listener: LX.IpcRendererEventListenerParams<any>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUpdateDownloaded(listener)
}
