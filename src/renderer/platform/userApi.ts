import {
  getUserApiList as getDesktopUserApiList,
  importUserApi as importDesktopUserApi,
  onShowUserApiUpdateAlert as onDesktopUserApiUpdateAlert,
  onUserApiStatus as onDesktopUserApiStatus,
  removeUserApi as removeDesktopUserApi,
  sendUserApiRequest as sendDesktopUserApiRequest,
  setAllowShowUserApiUpdateAlert as setDesktopAllowShowUserApiUpdateAlert,
  setUserApi as setDesktopUserApi,
  userApiRequestCancel as cancelDesktopUserApiRequest,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'

export const importRuntimeUserApi = async(script: string) => {
  if (isWebRuntime) return { apiList: [] } as LX.UserApi.ImportUserApi
  return importDesktopUserApi(script)
}

export const removeRuntimeUserApi = async(ids: string[]) => {
  if (isWebRuntime) return []
  return removeDesktopUserApi(ids)
}

export const setRuntimeUserApiUpdateAlert = async(id: string, enable: boolean) => {
  if (isWebRuntime) return
  await setDesktopAllowShowUserApiUpdateAlert(id, enable)
}

export const subscribeRuntimeUserApiStatus = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiStatus>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUserApiStatus(listener)
}

export const subscribeRuntimeUserApiUpdateAlert = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiUpdateInfo>) => {
  if (isWebRuntime) return () => {}
  return onDesktopUserApiUpdateAlert(listener)
}

export const getRuntimeUserApiList = async() => {
  if (isWebRuntime) return []
  return getDesktopUserApiList()
}

export const sendRuntimeUserApiRequest = async(params: LX.UserApi.UserApiRequestParams) => {
  if (isWebRuntime) throw new Error('User API is not available in Web runtime')
  return sendDesktopUserApiRequest(params)
}

export const cancelRuntimeUserApiRequest = (requestKey: LX.UserApi.UserApiRequestCancelParams) => {
  if (isWebRuntime) return
  cancelDesktopUserApiRequest(requestKey)
}

export const setRuntimeUserApiSource = async(source: LX.UserApi.UserApiSetApiParams) => {
  if (isWebRuntime) return
  await setDesktopUserApi(source)
}
