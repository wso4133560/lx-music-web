import { watch } from '@common/utils/vueTools'
import { isFullscreen, proxy, sync, windowSizeList } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { setPlatformWindowSize } from '@renderer/platform/system'
import { setLanguage } from '@root/lang'
import { setUserApi } from '../apiSource'
import { getSyncSnapshot, requestSyncAction } from '@renderer/platform/sync'
// import { applyTheme, getThemes } from '@renderer/store/utils'

const isWebRuntime = !(window as any).require?.('electron')

export default () => {
  const refreshSyncStatus = async() => {
    try {
      const { server, client } = await getSyncSnapshot()
      sync.server.status.status = server.status
      sync.server.status.message = server.message
      sync.server.status.address = server.address
      sync.server.status.code = server.code
      sync.server.status.devices = server.devices
      sync.client.status.status = client.status
      sync.client.status.message = client.message
      sync.client.status.address = client.address
    } catch (err) {
      console.log(err)
    }
  }

  watch(() => appSetting['common.windowSizeId'], (index) => {
    if (isWebRuntime) return
    const info = index == null ? windowSizeList[2] : windowSizeList[index]
    setPlatformWindowSize(info.width, info.height)
  })
  watch(() => appSetting['common.fontSize'], (fontSize) => {
    if (isFullscreen.value) return
    document.documentElement.style.fontSize = `${fontSize}px`
  })

  watch(() => appSetting['common.langId'], (id) => {
    if (!id) return
    setLanguage(id)
    window.setLang(id)
  })

  watch(() => appSetting['common.apiSource'], apiSource => {
    void setUserApi(apiSource)
  })

  watch(() => appSetting['common.font'], (val) => {
    document.documentElement.style.fontFamily = val
  }, {
    immediate: true,
  })

  watch(() => appSetting['sync.mode'], (mode) => {
    sync.mode = mode
  })

  watch(() => appSetting['sync.enable'], enable => {
    if (!isWebRuntime) {
      switch (appSetting['sync.mode']) {
        case 'server':
          if (appSetting['sync.server.port']) {
            void requestSyncAction({
              action: 'enable_server',
              data: {
                enable: appSetting['sync.enable'],
                port: appSetting['sync.server.port'],
              },
            }).then(refreshSyncStatus).catch(err => {
              console.log(err)
            })
          }
          break
        case 'client':
          if (appSetting['sync.client.host']) {
            void requestSyncAction({
              action: 'enable_client',
              data: {
                enable: appSetting['sync.enable'],
                host: appSetting['sync.client.host'],
              },
            }).then(refreshSyncStatus).catch(err => {
              console.log(err)
            })
          }
          break
        default:
          break
      }
    } else {
      void refreshSyncStatus()
    }
    sync.enable = enable
  })
  watch(() => appSetting['sync.server.port'], port => {
    if (appSetting['sync.mode'] == 'server') {
      void requestSyncAction({
        action: 'enable_server',
        data: {
          enable: appSetting['sync.enable'],
          port: appSetting['sync.server.port'],
        },
      }).then(refreshSyncStatus).catch(err => {
        console.log(err)
      })
    }
    sync.server.port = port
  })
  watch(() => appSetting['sync.client.host'], host => {
    if (appSetting['sync.mode'] == 'client') {
      void requestSyncAction({
        action: 'enable_client',
        data: {
          enable: appSetting['sync.enable'],
          host: appSetting['sync.client.host'],
        },
      }).then(refreshSyncStatus).catch(err => {
        console.log(err)
      })
    }
    sync.client.host = host
  })

  watch(() => appSetting['network.proxy.enable'], enable => {
    proxy.enable = enable
  })
  watch(() => appSetting['network.proxy.host'], host => {
    proxy.host = host
  })
  watch(() => appSetting['network.proxy.port'], port => {
    proxy.port = port
  })
}
