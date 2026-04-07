import {
  clearEnvParamsDeeplink as clearDesktopEnvParamsDeeplink,
  closeWindow as closeDesktopWindow,
  focusWindow as focusDesktopWindow,
  maxWindow as maxDesktopWindow,
  minWindow as minDesktopWindow,
  onDeeplink as onDesktopDeeplink,
  onFocus as onDesktopFocus,
  onSettingChanged as onDesktopSettingChanged,
  onThemeChange as onDesktopThemeChange,
  openDevTools as openDesktopDevTools,
  quitApp as quitDesktopApp,
  setFullScreen as setDesktopFullScreen,
  showHideWindowToggle as toggleDesktopWindowVisibility,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const closeRuntimeWindow = () => {
  if (isWebRuntime) return
  closeDesktopWindow()
}

export const minRuntimeWindow = () => {
  if (isWebRuntime) return
  minDesktopWindow()
}

export const maxRuntimeWindow = () => {
  if (isWebRuntime) return
  maxDesktopWindow()
}

export const quitRuntimeApp = () => {
  if (isWebRuntime) return
  quitDesktopApp()
}

export const focusRuntimeWindow = () => {
  if (isWebRuntime) return
  focusDesktopWindow()
}

export const toggleRuntimeWindowVisibility = () => {
  if (isWebRuntime) return
  toggleDesktopWindowVisibility()
}

export const setRuntimeFullScreen = async(isFullscreen: boolean) => {
  if (isWebRuntime) return isFullscreen
  return setDesktopFullScreen(isFullscreen)
}

export const openRuntimeDevTools = () => {
  if (isWebRuntime) return
  openDesktopDevTools()
}

export const clearRuntimeDeeplink = () => {
  if (isWebRuntime) return
  clearDesktopEnvParamsDeeplink()
}

export const subscribeRuntimeFocus = (listener: LX.IpcRendererEventListener) => {
  if (isWebRuntime) return () => {}
  return onDesktopFocus(listener)
}

export const subscribeRuntimeSettingChanges = (listener: LX.IpcRendererEventListenerParams<Partial<LX.AppSetting>>) => {
  if (isWebRuntime) return () => {}
  return onDesktopSettingChanged(listener)
}

export const subscribeRuntimeThemeChanges = (listener: LX.IpcRendererEventListenerParams<LX.ThemeSetting>) => {
  if (isWebRuntime) return () => {}
  return onDesktopThemeChange(listener)
}

export const subscribeRuntimeDeeplink = (listener: LX.IpcRendererEventListenerParams<string>) => {
  if (isWebRuntime) return () => {}
  return onDesktopDeeplink(listener)
}
