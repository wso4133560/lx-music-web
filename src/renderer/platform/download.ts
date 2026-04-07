import {
  downloadTasksGet as getDesktopDownloadTasks,
  downloadTasksCreate as createDesktopDownloadTasks,
  downloadTasksUpdate as updateDesktopDownloadTasks,
  downloadTasksRemove as removeDesktopDownloadTasks,
} from '@renderer/utils/ipc'
import { DOWNLOAD_STATUS, QUALITYS } from '@common/constants'
import { filterFileName } from '@common/utils/common'
import { clipFileNameLength, clipNameLength } from '@common/utils/tools'
import { readWebStorage, writeWebStorage } from './webStorage'
import { isWebRuntime } from './runtime'

const WEB_DOWNLOAD_TASKS_KEY = 'download_tasks'

const getExt = (type: LX.Quality): LX.Download.FileExt => {
  switch (type) {
    case 'ape':
      return 'ape'
    case 'flac':
    case 'flac24bit':
      return 'flac'
    case 'wav':
      return 'wav'
    default:
      return 'mp3'
  }
}

const getMusicType = (musicInfo: LX.Music.MusicInfoOnline, type: LX.Quality, qualityList: LX.QualityList): LX.Quality => {
  const list = qualityList[musicInfo.source]
  if (!list) return '128k'
  if (!list.includes(type)) type = list[list.length - 1]
  for (const quality of QUALITYS.slice(QUALITYS.indexOf(type))) {
    if (musicInfo.meta._qualitys[quality]) return quality
  }
  return '128k'
}

const createWebDownloadTask = (
  musicInfo: LX.Music.MusicInfoOnline,
  type: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
): LX.Download.ListItem => {
  type = getMusicType(musicInfo, type, qualityList)
  const ext = getExt(type)
  return {
    id: `${musicInfo.id}_${type}_${ext}`,
    isComplate: false,
    status: DOWNLOAD_STATUS.WAITING,
    statusText: '待下载',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    writeQueue: 0,
    metadata: {
      musicInfo,
      url: null,
      quality: type,
      ext,
      fileName: filterFileName(`${clipFileNameLength(fileNameFormat
        .replace('歌名', musicInfo.name)
        .replace('歌手', clipNameLength(musicInfo.singer)))}.${ext}`),
      filePath: '',
      listId,
    },
  }
}

const readWebDownloadTasks = () => readWebStorage<LX.Download.ListItem[]>(WEB_DOWNLOAD_TASKS_KEY, [])

const writeWebDownloadTasks = (tasks: LX.Download.ListItem[]) => {
  writeWebStorage(WEB_DOWNLOAD_TASKS_KEY, tasks)
}

export const getStoredDownloadTasks = async() => {
  if (isWebRuntime) return readWebDownloadTasks()
  return getDesktopDownloadTasks()
}

export const saveCreatedDownloadTasks = async(list: LX.Download.ListItem[], addMusicLocationType: LX.AddMusicLocationType) => {
  if (isWebRuntime) {
    const current = readWebDownloadTasks()
    const next = addMusicLocationType === 'top'
      ? [...list, ...current]
      : [...current, ...list]
    writeWebDownloadTasks(next)
    return
  }
  await createDesktopDownloadTasks(list, addMusicLocationType)
}

export const saveUpdatedDownloadTasks = async(list: LX.Download.ListItem[]) => {
  if (isWebRuntime) {
    const current = readWebDownloadTasks()
    const updateMap = new Map(list.map(item => [item.id, item]))
    writeWebDownloadTasks(current.map(item => updateMap.get(item.id) ?? item))
    return
  }
  await updateDesktopDownloadTasks(list)
}

export const removeStoredDownloadTasks = async(ids: string[]) => {
  if (isWebRuntime) {
    const idSet = new Set(ids)
    writeWebDownloadTasks(readWebDownloadTasks().filter(item => !idSet.has(item.id)))
    return
  }
  await removeDesktopDownloadTasks(ids)
}

export const createPlatformDownloadTasks = (
  list: LX.Music.MusicInfoOnline[],
  quality: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
) => {
  if (!isWebRuntime) return []
  return list.map(musicInfo => createWebDownloadTask(musicInfo, quality, fileNameFormat, qualityList, listId))
}

export const startBrowserDownload = async(downloadInfo: LX.Download.ListItem) => {
  const url = downloadInfo.metadata.url
  if (!url) throw new Error('Download url is empty')

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = downloadInfo.metadata.fileName
  anchor.rel = 'noopener noreferrer'
  anchor.target = '_blank'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
