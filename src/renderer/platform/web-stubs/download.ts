export type Options = {
  url: string
  path: string
  fileName: string
  method?: string
  proxy?: { host: string, port: number }
  onCompleted?: () => void
  onError?: (error: Error) => void
  onFail?: (response: { statusCode?: number }) => void
  onStart?: () => void
  onProgress?: (status: any) => void
  onStop?: () => void
}

export type DownloaderType = {
  refreshUrl: (url: string) => void
  updateSaveInfo: (savePath: string, fileName: string) => void
  start: () => Promise<void>
  stop: () => Promise<void>
}

export const createDownload = (options: Options): DownloaderType => {
  let currentUrl = options.url
  let savePath = options.path
  let saveFileName = options.fileName

  return {
    refreshUrl(url: string) {
      currentUrl = url
    },
    updateSaveInfo(path: string, fileName: string) {
      savePath = path
      saveFileName = fileName
    },
    async start() {
      options.onStart?.()
      options.onError?.(new Error(`Web runtime does not support download worker: ${currentUrl || savePath || saveFileName}`))
    },
    async stop() {
      options.onStop?.()
    },
  }
}
