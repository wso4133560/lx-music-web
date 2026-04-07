import {
  clearCache as clearDesktopCache,
  clearLyricEdited as clearDesktopLyricEdited,
  clearLyricRaw as clearDesktopLyricRaw,
  clearMusicUrl as clearDesktopMusicUrl,
  clearOtherSource as clearDesktopOtherSource,
  getCacheSize as getDesktopCacheSize,
  getLyricEditedCount as getDesktopLyricEditedCount,
  getLyricRawCount as getDesktopLyricRawCount,
  getMusicUrlCount as getDesktopMusicUrlCount,
  getOtherSourceCount as getDesktopOtherSourceCount,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const getResourceCacheSize = async() => {
  if (isWebRuntime) return 0
  return getDesktopCacheSize()
}

export const clearResourceCache = async() => {
  if (isWebRuntime) return
  await clearDesktopCache()
}

export const getOtherSourceCacheCount = async() => {
  if (isWebRuntime) return 0
  return getDesktopOtherSourceCount()
}

export const clearOtherSourceCache = async() => {
  if (isWebRuntime) return
  await clearDesktopOtherSource()
}

export const getMusicUrlCacheCount = async() => {
  if (isWebRuntime) return 0
  return getDesktopMusicUrlCount()
}

export const clearMusicUrlCache = async() => {
  if (isWebRuntime) return
  await clearDesktopMusicUrl()
}

export const getLyricRawCacheCount = async() => {
  if (isWebRuntime) return 0
  return getDesktopLyricRawCount()
}

export const clearLyricRawCache = async() => {
  if (isWebRuntime) return
  await clearDesktopLyricRaw()
}

export const getLyricEditedCacheCount = async() => {
  if (isWebRuntime) return 0
  return getDesktopLyricEditedCount()
}

export const clearLyricEditedCache = async() => {
  if (isWebRuntime) return
  await clearDesktopLyricEdited()
}
