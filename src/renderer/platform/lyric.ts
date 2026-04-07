import {
  removeLyricEdited as removeDesktopLyricEdited,
  saveLyricEdited as saveDesktopLyricEdited,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const saveEditedLyric = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo) => {
  if (isWebRuntime) return
  await saveDesktopLyricEdited(musicInfo, lyricInfo)
}

export const removeEditedLyric = async(musicInfo: LX.Music.MusicInfo) => {
  if (isWebRuntime) return
  await removeDesktopLyricEdited(musicInfo)
}
