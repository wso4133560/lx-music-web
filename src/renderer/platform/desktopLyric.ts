import { onNewDesktopLyricProcess as onDesktopLyricProcess } from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const subscribeDesktopLyricProcess = (listener: LX.IpcRendererEventListener) => {
  if (isWebRuntime) return () => {}
  return onDesktopLyricProcess(listener)
}
