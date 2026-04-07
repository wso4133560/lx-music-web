import { log } from './utils'

const ignoreErrorMessage = [
  'Possible side-effect in debug-evaluate',
  'Unexpected end of input',
]

const runtimeProcess = (globalThis as any).process

const handleError = (err: any) => {
  if (ignoreErrorMessage.includes(err?.message)) return
  console.error('An uncaught error occurred!')
  console.error(err)
  log.error(err)
}

if (typeof runtimeProcess?.on == 'function') {
  runtimeProcess.on('uncaughtException', handleError)
  runtimeProcess.on('unhandledRejection', (reason: any, p: Promise<any>) => {
    console.error('Unhandled Rejection at: Promise ', p)
    console.error(' reason: ', reason)
    log.error(reason)
  })
} else if (typeof window != 'undefined') {
  window.addEventListener('error', event => {
    handleError(event.error ?? new Error(event.message))
  })
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled Rejection:', event.reason)
    log.error(event.reason)
  })
}
