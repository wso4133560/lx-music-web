import {
  removeTheme as removeDesktopTheme,
  saveTheme as saveDesktopTheme,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const saveRuntimeTheme = async(theme: LX.Theme) => {
  if (isWebRuntime) return theme
  return saveDesktopTheme(theme)
}

export const removeRuntimeTheme = async(id: string) => {
  if (isWebRuntime) return
  await removeDesktopTheme(id)
}
