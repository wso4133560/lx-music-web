import {
  onSyncAction as onDesktopSyncAction,
  sendSyncAction as sendDesktopSyncAction,
  getSyncServerDevices as getDesktopSyncServerDevices,
  removeSyncServerDevice as removeDesktopSyncServerDevice,
} from '@renderer/utils/ipc'
import { isWebRuntime } from './runtime'
import { requestJson } from './http'

export interface SyncSnapshot {
  server: LX.Sync.ServerStatus
  client: LX.Sync.ClientStatus
}

const defaultServerStatus = (): LX.Sync.ServerStatus => ({
  status: false,
  message: '',
  address: [],
  code: '',
  devices: [],
})

const defaultClientStatus = (): LX.Sync.ClientStatus => ({
  status: false,
  message: '',
  address: [],
})

const normalizeServerStatus = (status?: Partial<LX.Sync.ServerStatus> | null): LX.Sync.ServerStatus => ({
  ...defaultServerStatus(),
  ...status,
  address: status?.address ?? [],
  devices: status?.devices ?? [],
})

const normalizeClientStatus = (status?: Partial<LX.Sync.ClientStatus> | null): LX.Sync.ClientStatus => ({
  ...defaultClientStatus(),
  ...status,
  address: status?.address ?? [],
})

export const getSyncSnapshot = async(): Promise<SyncSnapshot> => {
  if (isWebRuntime) {
    const snapshot = await requestJson<Partial<SyncSnapshot>>('/api/sync/status')
    return {
      server: normalizeServerStatus(snapshot.server),
      client: normalizeClientStatus(snapshot.client),
    }
  }

  const [server, client] = await Promise.all([
    sendDesktopSyncAction({ action: 'get_server_status' }) as Promise<LX.Sync.ServerStatus | undefined>,
    sendDesktopSyncAction({ action: 'get_client_status' }) as Promise<LX.Sync.ClientStatus | undefined>,
  ])

  return {
    server: normalizeServerStatus(server),
    client: normalizeClientStatus(client),
  }
}

export const requestSyncAction = async(action: LX.Sync.SyncServiceActions) => {
  if (isWebRuntime) {
    await requestJson<void>('/api/sync/action', {
      method: 'POST',
      body: action,
    })
    return
  }
  await sendDesktopSyncAction(action)
}

export const subscribeSyncActions = (listener: LX.IpcRendererEventListenerParams<LX.Sync.SyncMainWindowActions>) => {
  if (isWebRuntime) return () => {}
  return onDesktopSyncAction(listener)
}

export const listSyncServerDevices = async() => {
  if (isWebRuntime) {
    return requestJson<LX.Sync.ServerDevices>('/api/sync/server/devices')
  }
  return getDesktopSyncServerDevices()
}

export const removeSyncServerDevice = async(clientId: string) => {
  if (isWebRuntime) {
    await requestJson<void>(`/api/sync/server/devices/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
    })
    return
  }
  await removeDesktopSyncServerDevice(clientId)
}
