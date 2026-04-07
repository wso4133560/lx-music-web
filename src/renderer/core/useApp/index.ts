import { proxy, isFullscreen, themeId } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { getRuntimeEnvParams, getRuntimeViewPrevState, notifyRuntimeInited, triggerRuntimeUpdateCheck } from '@renderer/platform/app'

import useSync from './useSync'
import useDataInit from './useDataInit'
import useHandleEnvParams from './useHandleEnvParams'
import useEventListener from './useEventListener'
import usePlayer from './usePlayer'
import useSettingSync from './useSettingSync'
import { useRouter } from '@common/utils/vueRouter'
import handleListAutoUpdate from './listAutoUpdate'

const isWebRuntime = !(window as any).require?.('electron')

export default () => {
  proxy.enable = appSetting['network.proxy.enable']
  proxy.host = appSetting['network.proxy.host']
  proxy.port = appSetting['network.proxy.port']
  isFullscreen.value = appSetting['common.startInFullscreen']
  themeId.value = appSetting['theme.id']

  const router = useRouter()
  const initSyncService = useSync()
  useEventListener()
  const initPlayer = usePlayer()
  const handleEnvParams = useHandleEnvParams()
  const initData = useDataInit()
  useSettingSync()

  void getRuntimeEnvParams().then(async envParams => {
    let initDeeplink = async(_envParams: LX.EnvParams) => {}
    let initOpenAPI = async() => {}
    let initStatusbarLyric = async() => {}

    if (!isWebRuntime) {
      const [
        { default: useDeeplink },
        { default: useOpenAPI },
        { default: useStatusbarLyric },
        { default: useUpdate },
      ] = await Promise.all([
        import('./useDeeplink'),
        import('./useOpenAPI'),
        import('./useStatusbarLyric'),
        import('./useUpdate'),
      ])
      initDeeplink = useDeeplink()
      initOpenAPI = useOpenAPI()
      initStatusbarLyric = useStatusbarLyric()
      useUpdate()
    }

    const safeEnvParams = envParams ?? {
      cmdParams: {},
      deeplink: null,
    } as LX.EnvParams
    const envProxy = safeEnvParams.cmdParams['proxy-server']
    if (envProxy && typeof envProxy == 'string') {
      const [host, port = ''] = envProxy.split(':')
      proxy.envProxy = {
        host,
        port,
      }
    }

    void getRuntimeViewPrevState().then(state => {
      if (!state?.url) return
      void router.push({ path: state.url, query: state.query })
    })

    void initData().then(() => {
      initPlayer()
      handleEnvParams(safeEnvParams)
      void initSyncService()
      if (!isWebRuntime) {
        void initDeeplink(safeEnvParams)
        void initOpenAPI()
        void initStatusbarLyric()
        notifyRuntimeInited()
        if (window.lx.isProd && appSetting['common.isAgreePact']) triggerRuntimeUpdateCheck()
      }

      handleListAutoUpdate()
    })
  })
}
