import { sendOpenAPIAction as sendDesktopOpenAPIAction } from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const sendRuntimeOpenAPIAction = async(action: LX.OpenAPI.Actions) => {
  if (isWebRuntime) {
    return {
      address: '',
      message: '',
    } as LX.OpenAPI.Status
  }
  return sendDesktopOpenAPIAction(action)
}
