import { watch } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { openAPI } from '@renderer/store'
import { setDisableAutoPauseBySource } from '@renderer/core/lyric'
import { sendRuntimeOpenAPIAction } from '@renderer/platform/openapi'

export default () => {
  const handleEnable = async(enable: boolean, port: string, bindLan: boolean) => {
    await sendRuntimeOpenAPIAction({
      action: 'enable',
      data: {
        enable,
        port,
        bindLan,
      },
    }).then((status) => {
      openAPI.address = status.address
      openAPI.message = status.message
    }).catch((error) => {
      openAPI.address = ''
      openAPI.message = error.message
    }).finally(() => {
      setDisableAutoPauseBySource(!!openAPI.address, 'openAPI')
    })
  }
  watch(() => appSetting['openAPI.enable'], enable => {
    void handleEnable(enable, appSetting['openAPI.port'], appSetting['openAPI.bindLan'])
  })

  watch(() => appSetting['openAPI.port'], port => {
    if (!appSetting['openAPI.enable']) return
    void handleEnable(appSetting['openAPI.enable'], port, appSetting['openAPI.bindLan'])
  })

  watch(() => appSetting['openAPI.bindLan'], bindLan => {
    if (!appSetting['openAPI.enable']) return
    void handleEnable(appSetting['openAPI.enable'], appSetting['openAPI.port'], bindLan)
  })

  return async() => {
    if (appSetting['openAPI.enable']) {
      void handleEnable(true, appSetting['openAPI.port'], appSetting['openAPI.bindLan'])
    }
  }
}
