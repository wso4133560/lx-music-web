const detectBrowserPlatform = (): NodeJS.Platform => {
  if (typeof navigator == 'undefined') return 'linux'
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('windows')) return 'win32'
  if (userAgent.includes('mac os')) return 'darwin'
  return 'linux'
}

const runtimeProcess = (() => {
  if (typeof globalThis == 'undefined') return { env: {}, platform: 'linux' as NodeJS.Platform }
  return ((globalThis as any).process ??= {
    env: {},
    versions: {},
    platform: detectBrowserPlatform(),
    arch: '',
  })
})()

const consoleLog = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  log: console.log.bind(console),
  debug: console.debug.bind(console),
}

const getRuntimeRequire = () => {
  const webpackRequire = (globalThis as any).__non_webpack_require__
  if (typeof webpackRequire == 'function') return webpackRequire
  const windowRequire = (globalThis as any).window?.require
  if (typeof windowRequire == 'function') return windowRequire
  return null
}

const resolveLog = () => {
  const runtimeRequire = getRuntimeRequire()
  if (!runtimeRequire) return consoleLog
  try {
    return runtimeRequire('electron-log/node')
  } catch {
    return consoleLog
  }
}

export const isLinux = runtimeProcess.platform == 'linux'
export const isWin = runtimeProcess.platform == 'win32'
export const isMac = runtimeProcess.platform == 'darwin'
export const isProd = runtimeProcess.env.NODE_ENV == 'production'

export const getPlatform = (platform: NodeJS.Platform = runtimeProcess.platform) => {
  switch (platform) {
    case 'win32': return 'windows'
    case 'darwin': return 'mac'
    default: return 'linux'
  }
}


// https://stackoverflow.com/a/53387532
export function compareVer(currentVer: string, targetVer: string): -1 | 0 | 1 {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = (s: string) => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  const currentVerArr: Array<string | number> = ('' + currentVer).replace(/[^0-9.]/g, fix).split('.')
  const targetVerArr: Array<string | number> = ('' + targetVer).replace(/[^0-9.]/g, fix).split('.')
  let c = Math.max(currentVerArr.length, targetVerArr.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVerArr[i] = ~~currentVerArr[i]
    targetVerArr[i] = ~~targetVerArr[i]
    if (currentVerArr[i] > targetVerArr[i]) return 1
    else if (currentVerArr[i] < targetVerArr[i]) return -1
  }
  return 0
}


export {
  resolveLog as _resolveLog,
}

export const log = resolveLog()

export * from './common'
