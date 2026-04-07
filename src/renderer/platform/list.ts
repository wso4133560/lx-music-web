import { SPLIT_CHAR } from '@common/constants'
import { arrPushByPosition, arrShuffle, similar, sortInsert } from '@common/utils/common'
import { isElectronRuntime } from './runtime'

type PlayableListItem = LX.Music.MusicInfo | LX.Download.ListItem

const hasWorkerMain = () => isElectronRuntime && !!window.lx?.worker?.main

export type SortFieldName = 'name' | 'singer' | 'albumName' | 'interval' | 'source'
export type SortFieldType = 'up' | 'down' | 'random'

export const filterPlayableMusicList = async({
  playedList,
  listId,
  list,
  playerMusicInfo,
  dislikeInfo,
  isNext,
}: {
  playedList: LX.Player.PlayMusicInfo[]
  listId: string
  list: PlayableListItem[]
  playerMusicInfo?: PlayableListItem
  dislikeInfo: Omit<LX.Dislike.DislikeInfo, 'rules'>
  isNext: boolean
}) => {
  if (hasWorkerMain()) {
    return window.lx.worker.main.filterMusicList({
      playedList,
      listId,
      list,
      playerMusicInfo,
      dislikeInfo,
      isNext,
    })
  }

  let playerIndex = -1

  const canPlayList: PlayableListItem[] = []
  const filteredPlayedList = playedList
    .filter(pmInfo => pmInfo.listId == listId && !pmInfo.isTempPlay)
    .map(({ musicInfo }) => musicInfo)

  const hasDislike = (info: LX.Music.MusicInfo) => {
    const name = info.name?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''
    const singer = info.singer?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''

    return dislikeInfo.musicNames.has(name) || dislikeInfo.singerNames.has(singer) ||
      dislikeInfo.names.has(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
  }

  let isDislike = false
  const filteredList = list.filter(item => {
    if ('progress' in item) {
      if (!item.isComplate) return false
    } else if (hasDislike(item)) {
      if (item.id != playerMusicInfo?.id) return false
      isDislike = true
    }

    canPlayList.push(item)

    const index = filteredPlayedList.findIndex(musicInfo => musicInfo.id == item.id)
    if (index > -1) {
      filteredPlayedList.splice(index, 1)
      return false
    }

    return true
  })

  if (playerMusicInfo) {
    if (isDislike) {
      if (filteredList.length <= 1) {
        filteredList.splice(0, 1)
        if (canPlayList.length > 1) {
          const currentMusicIndex = canPlayList.findIndex(musicInfo => musicInfo.id == playerMusicInfo.id)
          if (isNext) {
            playerIndex = currentMusicIndex - 1
            if (playerIndex < 0 && canPlayList.length > 1) playerIndex = canPlayList.length - 2
          } else {
            playerIndex = currentMusicIndex
            if (canPlayList.length <= 1) playerIndex = -1
          }
          canPlayList.splice(currentMusicIndex, 1)
        } else {
          canPlayList.splice(0, 1)
        }
      } else {
        const currentMusicIndex = filteredList.findIndex(musicInfo => musicInfo.id == playerMusicInfo.id)
        if (isNext) {
          playerIndex = currentMusicIndex - 1
          if (playerIndex < 0 && filteredList.length > 1) playerIndex = filteredList.length - 2
        } else {
          playerIndex = currentMusicIndex
          if (filteredList.length <= 1) playerIndex = -1
        }
        filteredList.splice(currentMusicIndex, 1)
      }
    } else {
      playerIndex = (filteredList.length ? filteredList : canPlayList).findIndex(musicInfo => musicInfo.id == playerMusicInfo.id)
    }
  }

  return {
    filteredList,
    canPlayList,
    playerIndex,
  }
}

const getIntv = (musicInfo: LX.Music.MusicInfo) => {
  if (!musicInfo.interval) return 0
  const intvArr = musicInfo.interval.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += parseInt(intvArr.pop()!, 10) * unit
    unit *= 60
  }
  return intv
}

export const sortListMusicInfo = async(list: LX.Music.MusicInfo[], sortType: SortFieldType, fieldName: SortFieldName, localeId: string) => {
  if (hasWorkerMain()) return window.lx.worker.main.sortListMusicInfo(list, sortType, fieldName, localeId)

  switch (sortType) {
    case 'random':
      arrShuffle(list)
      break
    case 'up':
      if (fieldName == 'interval') {
        list.sort((a, b) => {
          if (a.interval == null) {
            return b.interval == null ? 0 : -1
          }
          return b.interval == null ? 1 : getIntv(a) - getIntv(b)
        })
      } else {
        switch (fieldName) {
          case 'name':
          case 'singer':
          case 'source':
            list.sort((a, b) => {
              if (a[fieldName] == null) {
                return b[fieldName] == null ? 0 : -1
              }
              return b[fieldName] == null ? 1 : a[fieldName].localeCompare(b[fieldName], localeId)
            })
            break
          case 'albumName':
            list.sort((a, b) => {
              if (a.meta.albumName == null) {
                return b.meta.albumName == null ? 0 : -1
              }
              return b.meta.albumName == null ? 1 : a.meta.albumName.localeCompare(b.meta.albumName, localeId)
            })
            break
        }
      }
      break
    case 'down':
      if (fieldName == 'interval') {
        list.sort((a, b) => {
          if (a.interval == null) {
            return b.interval == null ? 0 : 1
          }
          return b.interval == null ? -1 : getIntv(b) - getIntv(a)
        })
      } else {
        switch (fieldName) {
          case 'name':
          case 'singer':
          case 'source':
            list.sort((a, b) => {
              if (a[fieldName] == null) {
                return b[fieldName] == null ? 0 : 1
              }
              return b[fieldName] == null ? -1 : b[fieldName].localeCompare(a[fieldName], localeId)
            })
            break
          case 'albumName':
            list.sort((a, b) => {
              if (a.meta.albumName == null) {
                return b.meta.albumName == null ? 0 : 1
              }
              return b.meta.albumName == null ? -1 : b.meta.albumName.localeCompare(a.meta.albumName, localeId)
            })
            break
        }
      }
      break
  }

  return list
}

const variantRxp = /(\(|（).+(\)|）)/g
const variantRxp2 = /\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[/g

export const filterDuplicateMusic = async(list: LX.Music.MusicInfo[], isFilterVariant = true) => {
  if (hasWorkerMain()) return window.lx.worker.main.filterDuplicateMusic(list, isFilterVariant)

  type DuplicateEntry = { id: string, index: number, musicInfo: LX.Music.MusicInfo }
  const listMap = new Map<string, DuplicateEntry[]>()
  const duplicateList = new Set<string>()

  const handleFilter = (name: string, index: number, musicInfo: LX.Music.MusicInfo) => {
    if (listMap.has(name)) {
      listMap.get(name)!.push({
        id: musicInfo.id,
        index,
        musicInfo,
      })
      duplicateList.add(name)
      return
    }

    listMap.set(name, [{
      id: musicInfo.id,
      index,
      musicInfo,
    }])
  }

  if (isFilterVariant) {
    list.forEach((musicInfo, index) => {
      let musicInfoName = musicInfo.name.toLowerCase().replace(variantRxp, '').replace(variantRxp2, '')
      musicInfoName ||= musicInfo.name.toLowerCase().replace(/\s+/g, '')
      handleFilter(musicInfoName, index, musicInfo)
    })
  } else {
    list.forEach((musicInfo, index) => {
      handleFilter(musicInfo.name.toLowerCase().trim(), index, musicInfo)
    })
  }

  const duplicateNames = Array.from(duplicateList)
  duplicateNames.sort((a, b) => a.localeCompare(b))
  return duplicateNames.map(name => listMap.get(name)!).flat()
}

export const searchListMusic = async(list: LX.Music.MusicInfo[], text: string) => {
  if (hasWorkerMain()) return window.lx.worker.main.searchListMusic(list, text)

  const result: LX.Music.MusicInfo[] = []
  const rxp = new RegExp(text.split('').map(s => s.replace(/[.*+?^${}()|[\]\\]/, '\\$&')).join('.*') + '.*', 'i')

  for (const musicInfo of list) {
    const str = `${musicInfo.name}${musicInfo.singer}${musicInfo.meta.albumName ? musicInfo.meta.albumName : ''}`
    if (rxp.test(str)) result.push(musicInfo)
  }

  const sortedList: Array<{ num: number, data: LX.Music.MusicInfo }> = []
  for (const musicInfo of result) {
    sortInsert(sortedList, {
      num: similar(text, `${musicInfo.name}${musicInfo.singer}${musicInfo.meta.albumName ? musicInfo.meta.albumName : ''}`),
      data: musicInfo,
    })
  }

  return sortedList.map(item => item.data).reverse()
}

export const createSortedList = async(list: LX.Music.MusicInfo[], position: number, ids: string[]) => {
  if (hasWorkerMain()) return window.lx.worker.main.createSortedList(list, position, ids)

  const infos: LX.Music.MusicInfo[] = []
  const map = new Map<string, LX.Music.MusicInfo>()

  for (const item of list) map.set(item.id, item)
  for (const id of ids) {
    const musicInfo = map.get(id)
    if (!musicInfo) continue
    infos.push(musicInfo)
    map.delete(id)
  }

  list = list.filter(musicInfo => map.has(musicInfo.id))
  arrPushByPosition(list, infos, Math.min(position, list.length))
  return list
}
