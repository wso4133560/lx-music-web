import { addListMusics, setFetchingListStatus } from '@renderer/store/list/action'
import { supportsLocalMusic } from '@renderer/platform/runtime'
import { createLocalMusicInfos } from '@renderer/platform/desktopFiles'
import { selectFiles } from '@renderer/platform/system'


const handleAddMusics = async(listId: string, filePaths: string[], index: number = -1) => {
  // console.log(index + 1, index + 201)
  const paths = filePaths.slice(index + 1, index + 201)
  const musicInfos = await createLocalMusicInfos(paths)
  if (musicInfos.length) await addListMusics(listId, musicInfos)
  index += 200
  if (filePaths.length - 1 > index) await handleAddMusics(listId, filePaths, index)
}
export const addLocalFile = async(listInfo: LX.List.MyListInfo) => {
  if (!supportsLocalMusic) return
  const { canceled, filePaths } = await selectFiles({
    title: window.i18n.t('lists__add_local_file_desc'),
    properties: ['openFile', 'multiSelections'],
    filters: [
      // https://support.google.com/chromebook/answer/183093
      // 3gp, .avi, .mov, .m4v, .m4a, .mp3, .mkv, .ogm, .ogg, .oga, .webm, .wav
      { name: 'Media File', extensions: ['mp3', 'flac', 'ogg', 'oga', 'wav', 'm4a'] },
      // { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (canceled || !filePaths.length) return

  console.log(filePaths)
  setFetchingListStatus(listInfo.id, true)
  await handleAddMusics(listInfo.id, filePaths)
  setFetchingListStatus(listInfo.id, false)
}
