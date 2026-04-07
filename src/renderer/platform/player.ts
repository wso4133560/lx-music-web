import {
  onPlayerAction as onDesktopPlayerAction,
  savePlayInfo as saveDesktopPlayInfo,
  sendPlayerStatus as sendDesktopPlayerStatus,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const saveRuntimePlayInfo = (playInfo: LX.Player.SavedPlayInfo) => {
  saveDesktopPlayInfo(playInfo)
}

export const publishPlayerStatus = (status: Partial<LX.Player.Status>) => {
  sendDesktopPlayerStatus(status)
}

export const subscribePlayerActions = (listener: LX.IpcRendererEventListenerParams<{
  action: LX.Player.PlayerAction
  data?: string | number | boolean
}>) => {
  if (isWebRuntime) return () => {}
  return onDesktopPlayerAction(listener)
}
