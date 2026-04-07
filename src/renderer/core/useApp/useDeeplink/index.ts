import { onBeforeUnmount } from '@common/utils/vueTools'
import { clearRuntimeDeeplink, focusRuntimeWindow, subscribeRuntimeDeeplink } from '@renderer/platform/window'

import { useDialog } from './utils'
import useMusicAction from './useMusicAction'
import useSonglistAction from './useSonglistAction'
import usePlayerAction from './usePlayerAction'
import { isWebRuntime } from '@renderer/platform/runtime'

export default () => {
  let isInited = false

  const showErrorDialog = useDialog()

  const handleMusicAction = useMusicAction()
  const handleSonglistAction = useSonglistAction()
  const handlePlayerAction = usePlayerAction()


  const handleLinkAction = async(link: string) => {
    // console.log(link)
    const [url, search] = link.split('?')
    const [type, action, ...paths] = url.replace('lxmusic://', '').split('/')
    const params: {
      paths: string[]
      data?: any
      [key: string]: any
    } = {
      paths: [],
    }
    if (search) {
      for (const param of search.split('&')) {
        const [key, value] = param.split('=')
        params[key] = value
      }
      if (params.data) params.data = JSON.parse(decodeURIComponent(params.data))
    }
    params.paths = paths.map(p => decodeURIComponent(p))
    console.log(params)
    switch (type) {
      case 'music':
        await handleMusicAction(action, params)
        break
      case 'songlist':
        await handleSonglistAction(action, params)
        break
      case 'player':
        await handlePlayerAction(action as any)
        break
      default: throw new Error('Unknown type: ' + type)
    }
  }

  const rDeeplink = isWebRuntime
    ? () => {}
    : subscribeRuntimeDeeplink(async({ params: link }) => {
      console.log(link)
      if (!isInited) return
      clearRuntimeDeeplink()
      try {
        await handleLinkAction(link)
      } catch (err: any) {
        showErrorDialog(err.message)
        focusRuntimeWindow()
      }
    })

  onBeforeUnmount(() => {
    rDeeplink()
  })

  return async(envParams: LX.EnvParams) => {
    if (envParams.deeplink) {
      clearRuntimeDeeplink()
      try {
        await handleLinkAction(envParams.deeplink)
      } catch (err: any) {
        showErrorDialog(err.message)
        focusRuntimeWindow()
      }
    }
    isInited = true
  }
}
