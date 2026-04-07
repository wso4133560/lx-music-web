import { buildLyrics } from './lrcTool'

export const writeMeta = async({ filePath, isEmbedLyricLx, isEmbedLyricT, isEmbedLyricR, ...meta }: {
  filePath: string
  isEmbedLyricLx: boolean
  isEmbedLyricT: boolean
  isEmbedLyricR: boolean
  title: string
  artist: string
  album: string
  APIC: string | null
}, lyric: LX.Music.LyricInfo, proxy?: { host: string, port: number }) => {
  const { setMeta } = await import('@common/utils/musicMeta')
  setMeta(filePath, { ...meta, lyrics: buildLyrics(lyric, isEmbedLyricLx, isEmbedLyricT, isEmbedLyricR) }, proxy)
}

export const saveLrc = async(lrcData: LX.Music.LyricInfo, info: {
  filePath: string
  format: LX.LyricFormat
  downloadLxlrc: boolean
  downloadTlrc: boolean
  downloadRlrc: boolean
}) => {
  const { saveLrc } = await import('./utils')
  await saveLrc(lrcData, info)
}
