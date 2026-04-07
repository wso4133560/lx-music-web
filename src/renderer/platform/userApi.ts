/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-implied-eval, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/promise-function-async, no-new-func, promise/param-names */
import CryptoJS from 'crypto-js'
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
import { readWebStorage, writeWebStorage } from './webStorage'
import { isWebRuntime } from './runtime'

const WEB_USER_API_STORAGE_KEY = 'user_api_storage'
const EVENT_NAMES = {
  request: 'request',
  inited: 'inited',
  updateAlert: 'updateAlert',
} as const
const ALL_SOURCES = ['kw', 'kg', 'tx', 'wy', 'mg', 'local'] as const
const SOURCE_QUALITYS: Record<string, LX.Quality[]> = {
  kw: ['128k', '320k', 'flac', 'flac24bit'],
  kg: ['128k', '320k', 'flac', 'flac24bit'],
  tx: ['128k', '320k', 'flac', 'flac24bit'],
  wy: ['128k', '320k', 'flac', 'flac24bit'],
  mg: ['128k', '320k', 'flac', 'flac24bit'],
  local: [],
}
const SOURCE_ACTIONS = {
  kw: ['musicUrl'],
  kg: ['musicUrl'],
  tx: ['musicUrl'],
  wy: ['musicUrl'],
  mg: ['musicUrl'],
  xm: ['musicUrl'],
  local: ['musicUrl', 'lyric', 'pic'],
} as const
const INFO_NAMES = {
  name: 24,
  description: 36,
  author: 56,
  homepage: 1024,
  version: 36,
} as const

type WebStoredUserApi = LX.UserApi.UserApiInfoFull
type WebUserApiRequestHandler = (event: {
  source: string
  action: LX.UserApi.UserApiSourceInfoActions
  info: any
}) => Promise<any> | any

const statusListeners = new Set<LX.IpcRendererEventListenerParams<LX.UserApi.UserApiStatus>>()
const updateListeners = new Set<LX.IpcRendererEventListenerParams<LX.UserApi.UserApiUpdateInfo>>()
let currentRuntime: {
  api: LX.UserApi.UserApiInfo
  requestHandler: WebUserApiRequestHandler | null
  requestAborters: Map<string, Array<() => void>>
  currentRequestKey: string
} | null = null
let loadToken = 0

const emitStatus = (params: LX.UserApi.UserApiStatus) => {
  for (const listener of statusListeners) listener({ event: null as any, params })
}
const emitUpdateAlert = (params: LX.UserApi.UserApiUpdateInfo) => {
  for (const listener of updateListeners) listener({ event: null as any, params })
}

const readWebUserApiStorage = (): WebStoredUserApi[] => {
  return readWebStorage<WebStoredUserApi[]>(WEB_USER_API_STORAGE_KEY, []).map(api => ({
    ...api,
    allowShowUpdateAlert: api.allowShowUpdateAlert ?? false,
  }))
}
const writeWebUserApiStorage = (apis: WebStoredUserApi[]) => {
  writeWebStorage(WEB_USER_API_STORAGE_KEY, apis)
}
const toUserApiInfo = ({ script, ...api }: WebStoredUserApi): LX.UserApi.UserApiInfo => api
const getWebUserApiList = () => readWebUserApiStorage().map(toUserApiInfo)

const matchInfo = (scriptInfo: string) => {
  const infoArr = scriptInfo.split(/\r?\n/)
  const rxp = /^\s?\*\s?@(\w+)\s(.+)$/
  const infos: Partial<Record<keyof typeof INFO_NAMES, string>> = {}
  for (const info of infoArr) {
    const result = rxp.exec(info)
    if (!result) continue
    const key = result[1] as keyof typeof INFO_NAMES
    if (INFO_NAMES[key] == null) continue
    infos[key] = result[2].trim()
  }

  for (const [key, len] of Object.entries(INFO_NAMES) as Array<[keyof typeof INFO_NAMES, number]>) {
    infos[key] ||= ''
    if (infos[key] != null && infos[key]!.length > len) infos[key] = infos[key]!.substring(0, len) + '...'
  }

  return infos as Record<keyof typeof INFO_NAMES, string>
}
const parseScriptInfo = (script: string) => {
  const result = /^\/\*[\S|\s]+?\*\//.exec(script)
  if (!result) throw new Error('无效的自定义源文件')

  const scriptInfo = matchInfo(result[0])
  scriptInfo.name ||= `user_api_${new Date().toLocaleString()}`
  return scriptInfo
}

const toUint8Array = (value: string | Buffer | Uint8Array, encoding: BufferEncoding = 'utf8') => {
  if (value instanceof Uint8Array) return value
  return Buffer.from(value, encoding)
}
const toWordArray = (value: string | Buffer | Uint8Array, encoding?: BufferEncoding) => {
  const bytes = toUint8Array(value as any, encoding)
  return CryptoJS.lib.WordArray.create(bytes as any)
}
const fromWordArray = (value: CryptoJS.LibWordArray) => {
  return Buffer.from(value.toString(CryptoJS.enc.Hex), 'hex')
}
const buildProxyRequestUrl = (url: string) => {
  if (!/^https?:\/\//.test(url)) return url
  const currentOrigin = globalThis.window?.location?.origin
  if (currentOrigin && url.startsWith(currentOrigin)) return url
  return `/__lx_proxy__?url=${encodeURIComponent(url)}`
}
const requestViaWeb = (
  url: string,
  options: {
    method?: string
    timeout?: number
    headers?: Record<string, string>
    body?: BodyInit | null
    form?: Record<string, string | number | boolean>
    formData?: Record<string, string | Blob>
  },
  callback: (error: Error | null, response?: any, body?: any) => void,
) => {
  const controller = new AbortController()
  const headers = new Headers(options.headers ?? {})
  let body = options.body ?? undefined
  if (options.form) {
    body = new URLSearchParams(Object.entries(options.form).map(([key, value]) => [key, String(value)])).toString()
    if (!headers.has('content-type')) headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
  } else if (options.formData) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(options.formData)) formData.append(key, value)
    body = formData
  }

  const requestUrl = buildProxyRequestUrl(url)
  if (requestUrl != url) {
    headers.set('x-lx-proxy-headers', encodeURIComponent(JSON.stringify(Array.from(headers.entries()))))
  }

  let isTimeout = false
  const timeoutId = options.timeout && options.timeout > 0
    ? window.setTimeout(() => {
      isTimeout = true
      controller.abort()
    }, Math.min(options.timeout, 60_000))
    : null

  fetch(requestUrl, {
    method: (options.method ?? 'GET').toUpperCase(),
    headers,
    body,
    redirect: 'follow',
    signal: controller.signal,
  }).then(async response => {
    const raw = await response.text()
    let parsedBody: any = raw
    try {
      parsedBody = JSON.parse(raw)
    } catch {}
    callback(null, {
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bytes: raw.length,
      raw,
      body: parsedBody,
    }, parsedBody)
  }).catch((error: any) => {
    if (isTimeout) callback(new Error('timeout'))
    else if (error?.name == 'AbortError') callback(new Error('cancelled'))
    else callback(error instanceof Error ? error : new Error(String(error)))
  }).finally(() => {
    if (timeoutId != null) window.clearTimeout(timeoutId)
  })

  return () => controller.abort()
}

const verifyLyricInfo = (info: any) => {
  if (typeof info != 'object' || typeof info.lyric != 'string') throw new Error('failed')
  if (info.lyric.length > 51200) throw new Error('failed')
  return {
    lyric: info.lyric,
    tlyric: typeof info.tlyric == 'string' && info.tlyric.length < 5120 ? info.tlyric : null,
    rlyric: typeof info.rlyric == 'string' && info.rlyric.length < 5120 ? info.rlyric : null,
    lxlyric: typeof info.lxlyric == 'string' && info.lxlyric.length < 8192 ? info.lxlyric : null,
  }
}
const normalizeSources = (api: LX.UserApi.UserApiInfo, info: any) => {
  const sourceInfo: LX.UserApi.UserApiSources = {} as LX.UserApi.UserApiSources
  for (const source of ALL_SOURCES) {
    const userSource = info?.sources?.[source]
    if (!userSource || userSource.type !== 'music') continue
    const qualitys = SOURCE_QUALITYS[source]
    const actions = SOURCE_ACTIONS[source] ?? []
    sourceInfo[source as LX.Source] = {
      type: 'music',
      actions: actions.filter(action => userSource.actions.includes(action)) as LX.UserApi.UserApiSourceInfoActions[],
      qualitys: qualitys.filter(quality => userSource.qualitys.includes(quality)),
      name: userSource.name ?? source,
    }
  }
  return {
    ...api,
    sources: sourceInfo,
  }
}

const createWebUserApiHost = (
  api: WebStoredUserApi,
  runtime: NonNullable<typeof currentRuntime>,
  resolveInit: () => void,
) => {
  let isInitedApi = false
  let isShowedUpdateAlert = false

  const host = {
    EVENT_NAMES,
    request(url: string, options: any = {}, callback: (error: Error | null, response?: any, body?: any) => void) {
      const requestKey = runtime.currentRequestKey
      const cancel = requestViaWeb(url, options, callback)
      if (requestKey) {
        const aborters = runtime.requestAborters.get(requestKey)
        aborters?.push(cancel)
      }
      return cancel
    },
    send(eventName: string, data: any) {
      return new Promise<void>((resolve, reject) => {
        switch (eventName) {
          case EVENT_NAMES.inited:
            if (isInitedApi) return reject(new Error('Script is inited'))
            isInitedApi = true
            runtime.api = normalizeSources(toUserApiInfo(api), data)
            emitStatus({
              status: true,
              apiInfo: runtime.api,
            })
            resolveInit()
            resolve()
            break
          case EVENT_NAMES.updateAlert:
            if (isShowedUpdateAlert) return reject(new Error('The update alert can only be called once.'))
            isShowedUpdateAlert = true
            emitUpdateAlert({
              name: api.name,
              description: api.description,
              log: typeof data?.log == 'string' ? data.log : '',
              updateUrl: typeof data?.updateUrl == 'string' ? data.updateUrl : undefined,
            })
            resolve()
            break
          default:
            reject(new Error('Unknown event name: ' + eventName))
            break
        }
      })
    },
    on(eventName: string, handler: WebUserApiRequestHandler) {
      if (eventName != EVENT_NAMES.request) return Promise.reject(new Error('The event is not supported: ' + eventName))
      runtime.requestHandler = handler
      return Promise.resolve()
    },
    utils: {
      crypto: {
        aesEncrypt(buffer: Buffer | Uint8Array, mode: string, key: Buffer | Uint8Array, iv: Buffer | Uint8Array) {
          if (!/^aes-\d+-/i.test(mode)) throw new Error('Unsupported AES mode')
          const encrypted = CryptoJS.AES.encrypt(toWordArray(buffer), toWordArray(key), {
            iv: /ecb$/i.test(mode) ? undefined : toWordArray(iv),
            mode: /ecb$/i.test(mode) ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          })
          return fromWordArray(encrypted.ciphertext)
        },
        rsaEncrypt() {
          throw new Error('RSA encrypt is not supported in Web runtime')
        },
        randomBytes(size: number) {
          return crypto.getRandomValues(new Uint8Array(size))
        },
        md5(str: string) {
          return CryptoJS.MD5(str).toString()
        },
      },
      buffer: {
        from(...args: Parameters<typeof Buffer.from>) {
          return Buffer.from(...args)
        },
        bufToString(buf: string | Buffer | Uint8Array, format?: BufferEncoding) {
          return Buffer.from(buf as any).toString(format)
        },
      },
      zlib: {
        inflate(buf: Buffer | Uint8Array) {
          return new Promise<Uint8Array>((resolve, reject) => {
            if (typeof DecompressionStream == 'undefined') return reject(new Error('Web runtime missing DecompressionStream support'))
            const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate'))
            new Response(stream).arrayBuffer().then(data => resolve(new Uint8Array(data))).catch(err => reject(new Error(err.message)))
          })
        },
        deflate(data: Buffer | Uint8Array) {
          return new Promise<Uint8Array>((resolve, reject) => {
            if (typeof CompressionStream == 'undefined') return reject(new Error('Web runtime missing CompressionStream support'))
            const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'))
            new Response(stream).arrayBuffer().then(buffer => resolve(new Uint8Array(buffer))).catch(err => reject(new Error(err.message)))
          })
        },
      },
    },
    currentScriptInfo: {
      name: api.name,
      description: api.description,
      version: api.version,
      author: api.author,
      homepage: api.homepage,
      rawScript: api.script,
    },
    version: '2.0.0',
    env: 'web',
  }

  const sandboxGlobals: Record<string | symbol, any> = {
    lx: host,
  }
  let sandboxWindow!: Window & typeof globalThis & { lx: any }
  sandboxWindow = new Proxy(window, {
    get(target, property) {
      if (property === 'window' || property === 'self' || property === 'globalThis') return sandboxWindow
      if (property in sandboxGlobals) return sandboxGlobals[property]

      const value = Reflect.get(target, property, target)
      return typeof value == 'function' ? value.bind(target) : value
    },
    set(target, property, value) {
      if (property in sandboxGlobals || property === 'window' || property === 'self' || property === 'globalThis') {
        sandboxGlobals[property] = value
        return true
      }
      return Reflect.set(target, property, value, target)
    },
    has(target, property) {
      return property in sandboxGlobals || property in target
    },
    getOwnPropertyDescriptor(target, property) {
      if (property in sandboxGlobals) {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: sandboxGlobals[property],
        }
      }
      return Reflect.getOwnPropertyDescriptor(target, property)
    },
  }) as Window & typeof globalThis & { lx: any }

  return {
    host,
    sandboxWindow,
  }
}

const executeWebUserApi = async(api: WebStoredUserApi, token: number) => {
  const runtime = {
    api: toUserApiInfo(api),
    requestHandler: null as WebUserApiRequestHandler | null,
    requestAborters: new Map<string, Array<() => void>>(),
    currentRequestKey: '',
  }
  let resolveInit!: () => void
  const initPromise = new Promise<void>((resolve) => {
    resolveInit = resolve
  })
  const { host, sandboxWindow } = createWebUserApiHost(api, runtime, resolveInit)

  try {
    new Function('lx', 'window', 'globalThis', 'self', api.script)(host, sandboxWindow, sandboxWindow, sandboxWindow)
  } catch (error: any) {
    throw new Error(error?.message ?? String(error))
  }

  await Promise.race([
    initPromise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('自定义源初始化超时')), 20_000)
    }),
  ])
  if (token != loadToken) return
  currentRuntime = runtime
}

const clearWebRuntime = () => {
  if (!currentRuntime) return
  for (const aborters of currentRuntime.requestAborters.values()) {
    for (const abort of aborters) abort()
  }
  currentRuntime.requestAborters.clear()
  currentRuntime = null
}

export const importRuntimeUserApi = async(script: string) => {
  if (!isWebRuntime) return importDesktopUserApi(script)
  const scriptInfo = parseScriptInfo(script)
  const apiInfo: WebStoredUserApi = {
    id: `user_api_${Math.random().toString().substring(2, 5)}_${Date.now()}`,
    ...scriptInfo,
    script,
    allowShowUpdateAlert: true,
  }
  const list = readWebUserApiStorage()
  list.push(apiInfo)
  writeWebUserApiStorage(list)
  return {
    apiInfo: toUserApiInfo(apiInfo),
    apiList: list.map(toUserApiInfo),
  } as LX.UserApi.ImportUserApi
}

export const removeRuntimeUserApi = async(ids: string[]) => {
  if (!isWebRuntime) return removeDesktopUserApi(ids)
  const currentId = currentRuntime?.api.id
  const list = readWebUserApiStorage().filter(api => !ids.includes(api.id))
  writeWebUserApiStorage(list)
  if (currentId && ids.includes(currentId)) clearWebRuntime()
  return list.map(toUserApiInfo)
}

export const setRuntimeUserApiUpdateAlert = async(id: string, enable: boolean) => {
  if (!isWebRuntime) {
    await setDesktopAllowShowUserApiUpdateAlert(id, enable)
    return
  }
  const list = readWebUserApiStorage()
  const targetApi = list.find(api => api.id == id)
  if (!targetApi) return
  targetApi.allowShowUpdateAlert = enable
  writeWebUserApiStorage(list)
}

export const subscribeRuntimeUserApiStatus = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiStatus>) => {
  if (!isWebRuntime) return onDesktopUserApiStatus(listener)
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

export const subscribeRuntimeUserApiUpdateAlert = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiUpdateInfo>) => {
  if (!isWebRuntime) return onDesktopUserApiUpdateAlert(listener)
  updateListeners.add(listener)
  return () => {
    updateListeners.delete(listener)
  }
}

export const getRuntimeUserApiList = async() => {
  if (!isWebRuntime) return getDesktopUserApiList()
  return getWebUserApiList()
}

export const sendRuntimeUserApiRequest = async(params: LX.UserApi.UserApiRequestParams) => {
  if (!isWebRuntime) return sendDesktopUserApiRequest(params)
  if (!currentRuntime?.requestHandler) throw new Error('user api is not load')

  const { requestKey, data } = params
  const aborters: Array<() => void> = []
  currentRuntime.requestAborters.set(requestKey, aborters)
  try {
    currentRuntime.currentRequestKey = requestKey
    const response = await Promise.resolve(currentRuntime.requestHandler({
      source: data.source,
      action: data.action,
      info: data.info,
    }))
    switch (data.action) {
      case 'musicUrl':
        if (typeof response != 'string' || !/^https?:/.test(response)) throw new Error('failed')
        return {
          source: data.source,
          action: data.action,
          data: {
            type: data.info.type,
            url: response,
          },
        }
      case 'lyric':
        return {
          source: data.source,
          action: data.action,
          data: verifyLyricInfo(response),
        }
      case 'pic':
        if (typeof response != 'string' || !/^https?:/.test(response)) throw new Error('failed')
        return {
          source: data.source,
          action: data.action,
          data: response,
        }
      default:
        throw new Error('Unknown action: ' + data.action)
    }
  } finally {
    currentRuntime.currentRequestKey = ''
    currentRuntime.requestAborters.delete(requestKey)
  }
}

export const cancelRuntimeUserApiRequest = (requestKey: LX.UserApi.UserApiRequestCancelParams) => {
  if (!isWebRuntime) {
    cancelDesktopUserApiRequest(requestKey)
    return
  }
  const aborters = currentRuntime?.requestAborters.get(requestKey)
  if (!aborters) return
  for (const abort of aborters) abort()
  currentRuntime?.requestAborters.delete(requestKey)
}

export const setRuntimeUserApiSource = async(source: LX.UserApi.UserApiSetApiParams) => {
  if (!isWebRuntime) {
    await setDesktopUserApi(source)
    return
  }
  clearWebRuntime()
  if (!/^user_api/.test(source)) return

  const api = readWebUserApiStorage().find(api => api.id == source)
  if (!api) throw new Error('api not found')

  const token = ++loadToken
  try {
    await executeWebUserApi(api, token)
  } catch (error: any) {
    if (token != loadToken) return
    emitStatus({
      status: false,
      apiInfo: toUserApiInfo(api),
      message: error?.message ?? String(error),
    })
    throw error
  }
}
