import {
  getMusicUrl as getDesktopMusicUrl,
  getPlayerLyric as getDesktopPlayerLyric,
  saveLyric as saveDesktopLyric,
  saveMusicUrl as saveDesktopMusicUrl,
} from '@renderer/utils/ipc'

export const getCachedMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality) => {
  return getDesktopMusicUrl(musicInfo, type)
}

export const saveCachedMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality, url: string) => {
  await saveDesktopMusicUrl(musicInfo, type, url)
}

export const getCachedPlayerLyric = async(musicInfo: LX.Music.MusicInfo) => {
  return getDesktopPlayerLyric(musicInfo)
}

export const saveCachedLyric = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo) => {
  await saveDesktopLyric(musicInfo, lyricInfo)
}
