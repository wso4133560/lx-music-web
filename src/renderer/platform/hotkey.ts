import {
  allHotKeys as desktopHotKeys,
  hotKeyGetStatus as getDesktopHotKeyStatus,
  hotKeySetConfig as setDesktopHotKeyConfig,
  hotKeySetEnable as setDesktopHotKeyEnable,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const runtimeHotKeys = desktopHotKeys

export const setRuntimeHotKeyEnable = async(enable: boolean) => {
  if (isWebRuntime) return
  return setDesktopHotKeyEnable(enable)
}

export const setRuntimeHotKeyConfig = async(config: LX.HotKeyActions) => {
  if (isWebRuntime) return
  return setDesktopHotKeyConfig(config)
}

export const getRuntimeHotKeyStatus = async() => {
  if (isWebRuntime) return {}
  return getDesktopHotKeyStatus()
}
