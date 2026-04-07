import {
  checkUpdate as checkDesktopUpdate,
  getEnvParams as getDesktopEnvParams,
  getPlayInfo as getDesktopPlayInfo,
  getViewPrevState as getDesktopViewPrevState,
  sendInited as sendDesktopInited,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const getRuntimeEnvParams = async() => {
  return getDesktopEnvParams()
}

export const getRuntimeViewPrevState = async() => {
  return getDesktopViewPrevState()
}

export const getRuntimePlayInfo = async() => {
  if (isWebRuntime) return null
  return getDesktopPlayInfo()
}

export const notifyRuntimeInited = () => {
  if (isWebRuntime) return
  sendDesktopInited()
}

export const triggerRuntimeUpdateCheck = () => {
  if (isWebRuntime) return
  checkDesktopUpdate()
}
