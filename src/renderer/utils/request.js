// import progress from 'request-progress'
import { debugRequest } from './env'
import { requestMsg } from './message'
import { bHh } from './musicSdk/options'
import { proxy } from '@renderer/store'
// import fs from 'fs'

const isWebRuntime = !(typeof window != 'undefined' && typeof window.require == 'function' && window.require('electron'))

const getRuntimeRequire = () => {
  const webpackRequire = globalThis.__non_webpack_require__
  if (typeof webpackRequire == 'function') return webpackRequire
  const windowRequire = globalThis.window?.require
  if (typeof windowRequire == 'function') return windowRequire
  return null
}

const getNodeRequestDeps = () => {
  const runtimeRequire = getRuntimeRequire()
  if (!runtimeRequire) throw new Error('Node runtime unavailable')
  return {
    needle: runtimeRequire('needle'),
    zlib: runtimeRequire('node:zlib'),
    tunnel: runtimeRequire('tunnel'),
  }
}

const httpsRxp = /^https:/
const httpUrlRxp = /^https?:\/\//
export const buildWebProxyUrl = url => {
  if (!isWebRuntime || !httpUrlRxp.test(url)) return url
  const currentOrigin = globalThis.window?.location?.origin
  if (currentOrigin && url.startsWith(currentOrigin)) return url
  return `/__lx_proxy__?url=${encodeURIComponent(url)}`
}
const getRequestAgent = url => {
  if (isWebRuntime) return undefined
  let options
  if (proxy.enable && proxy.host) {
    options = {
      proxy: {
        host: proxy.host,
        port: proxy.port,
      },
    }
  } else if (proxy.envProxy) {
    options = {
      proxy: {
        host: proxy.envProxy.host,
        port: proxy.envProxy.port,
      },
    }
  }
  if (!options) return undefined
  const { tunnel: { httpOverHttp, httpsOverHttp } } = getNodeRequestDeps()
  return (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)(options)
}


const request = (url, options, callback) => {
  if (isWebRuntime) return browserRequest(url, options, callback)

  let data
  if (options.body) {
    data = options.body
  } else if (options.form) {
    data = options.form
    // data.content_type = 'application/x-www-form-urlencoded'
    options.json = false
  } else if (options.formData) {
    data = options.formData
    // data.content_type = 'multipart/form-data'
    options.json = false
  }
  options.response_timeout = options.timeout

  const { needle } = getNodeRequestDeps()
  return needle.request(options.method || 'get', url, data, options, (err, resp, body) => {
    if (!err) {
      body = resp.body = resp.raw.toString()
      try {
        resp.body = JSON.parse(resp.body)
      } catch (_) {}
      body = resp.body
    }
    callback(err, resp, body)
  }).request
}

const normalizeBrowserError = (error, isTimeout) => {
  if (isTimeout) {
    const timeoutError = new Error(requestMsg.timeout)
    timeoutError.code = 'ETIMEDOUT'
    return timeoutError
  }
  if (error?.name == 'AbortError') return new Error(requestMsg.cancelRequest)
  return error
}

const browserRequest = (url, options, callback) => {
  const controller = new AbortController()
  const headers = new Headers(options.headers || {})
  const requestUrl = buildWebProxyUrl(url)
  let body = options.body ?? options.data
  if (options.form) {
    body = new URLSearchParams(options.form).toString()
    if (!headers.has('content-type')) headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
  } else if (options.formData) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(options.formData)) {
      formData.append(key, value)
    }
    body = formData
  }

  let isTimeout = false
  const timeoutId = options.timeout > 0
    ? setTimeout(() => {
      isTimeout = true
      controller.abort()
    }, options.timeout)
    : null

  if (requestUrl != url) {
    headers.set('x-lx-proxy-headers', encodeURIComponent(JSON.stringify(Array.from(headers.entries()))))
  }

  fetch(requestUrl, {
    method: (options.method || 'get').toUpperCase(),
    headers,
    body,
    redirect: 'follow',
    signal: controller.signal,
  }).then(async(response) => {
    const raw = await response.text()
    let responseBody = raw
    if (options.json !== false) {
      try {
        responseBody = JSON.parse(raw)
      } catch {}
    }
    const responseHeaders = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    callback(null, {
      body: responseBody,
      raw,
      headers: responseHeaders,
      statusCode: response.status,
      statusMessage: response.statusText,
    }, responseBody)
  }).catch(error => {
    callback(normalizeBrowserError(error, isTimeout), null)
  }).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })

  return {
    abort() {
      controller.abort()
    },
  }
}


const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}
// var proxyUrl = "http://" + user + ":" + password + "@" + host + ":" + port;
// var proxiedRequest = request.defaults({'proxy': proxyUrl});

/**
 * promise 形式的请求方法
 * @param {*} url
 * @param {*} options
 */
const buildHttpPromose = (url, options) => {
  let obj = {
    isCancelled: false,
    cancelHttp: () => {
      if (!obj.requestObj) return obj.isCancelled = true
      cancelHttp(obj.requestObj)
      obj.requestObj = null
      obj.promise = obj.cancelHttp = null
      obj.cancelFn(new Error(requestMsg.cancelRequest))
      obj.cancelFn = null
    },
  }
  obj.promise = new Promise((resolve, reject) => {
    obj.cancelFn = reject
    debugRequest && console.log(`\n---send request------${url}------------`)
    fetchData(url, options.method, options, (err, resp, body) => {
      // options.isShowProgress && window.api.hideProgress()
      debugRequest && console.log(`\n---response------${url}------------`)
      debugRequest && console.log(body)
      obj.requestObj = null
      obj.cancelFn = null
      if (err) return reject(err)
      resolve(resp)
    }).then(ro => {
      obj.requestObj = ro
      if (obj.isCancelled) obj.cancelHttp()
    })
  })
  return obj
}

/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFetch = (url, options = { method: 'get' }) => {
  const requestObj = buildHttpPromose(url, options)
  requestObj.promise = requestObj.promise.catch(err => {
    // console.log('出错', err)
    if (err.message === 'socket hang up') {
      // window.globalObj.apiSource = 'temp'
      return Promise.reject(new Error(requestMsg.unachievable))
    }
    switch (err.code) {
      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        return Promise.reject(new Error(requestMsg.timeout))
      case 'ENOTFOUND':
        return Promise.reject(new Error(requestMsg.notConnectNetwork))
      default:
        return Promise.reject(err)
    }
  })
  return requestObj
}

/**
 * 取消请求
 * @param {*} index
 */
export const cancelHttp = requestObj => {
  // console.log(requestObj)
  if (!requestObj) return
  // console.log('cancel:', requestObj)
  if (!requestObj.abort) return
  requestObj.abort()
}


/**
 * http 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} cb 回调
 * @return {Number} index 用于取消请求
 */
export const http = (url, options, cb) => {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  // 默认选项
  if (options.method == null) options.method = 'get'

  debugRequest && console.log(`\n---send request------${url}------------`)
  return fetchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(body)
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    cb(err, resp, body)
  })
}

/**
 * http get 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpGet = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(body)
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http post 请求
 * @param {*} url 请求地址
 * @param {*} data 提交的数据
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpPost = (url, data, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })
  options.data = data

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'post', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(body)
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http jsonp 请求
 * @param {*} url 请求地址
 * @param {*} options 选项
 *             options.jsonpCallback 回调
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const http_jsonp = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let jsonpCallback = 'jsonpCallback'
  if (url.indexOf('?') < 0) url += '?'
  url += `&${options.jsonpCallback}=${jsonpCallback}`

  options.format = 'script'

  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(body)
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    } else {
      body = JSON.parse(body.replace(new RegExp(`^${jsonpCallback}\\(({.*})\\)$`), '$1'))
    }

    callback(err, resp, body)
  })
}

const encodeText = text => {
  if (typeof TextEncoder != 'undefined') return new TextEncoder().encode(text)
  return Uint8Array.from(Buffer.from(text))
}

const bytesToHex = bytes => Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')

const handleDeflateRaw = data => new Promise((resolve, reject) => {
  if (!isWebRuntime) {
    const { zlib: { deflateRaw } } = getNodeRequestDeps()
    deflateRaw(data, (err, buf) => {
      if (err) return reject(err)
      resolve(buf)
    })
    return
  }
  if (typeof CompressionStream == 'undefined') {
    resolve(encodeText(data))
    return
  }
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'))
  new Response(stream).arrayBuffer()
    .then(buffer => resolve(new Uint8Array(buffer)))
    .catch(reject)
})

const regx = /(?:\d\w)+/g

const fetchData = async(url, method, {
  headers = {},
  format = 'json',
  timeout = 15000,
  ...options
}, callback) => {
  // console.log(url, options)
  console.log('---start---', url)
  headers = Object.assign({}, headers)
  if (headers[bHh]) {
    const path = url.replace(/^https?:\/\/[\w.:]+\//, '/')
    let s = isWebRuntime ? decodeURIComponent(bHh.replace(/(..)/g, '%$1')) : Buffer.from(bHh, 'hex').toString()
    s = s.replace(s.substr(-1), '')
    s = isWebRuntime ? atob(s) : Buffer.from(s, 'base64').toString()
    const appVersion = globalThis.process?.versions?.app || '0.0.0'
    let v = appVersion.split('-')[0].split('.').map(n => n.length < 3 ? n.padStart(3, '0') : n).join('')
    let v2 = appVersion.split('-')[1] || ''
    const rawValue = JSON.stringify(`${path}${v}`.match(regx), null, 1).concat(v)
    const compressed = await handleDeflateRaw(isWebRuntime ? btoa(rawValue) : Buffer.from(rawValue).toString('base64'))
    const encodedValue = typeof compressed?.toString == 'function' && !isWebRuntime ? compressed.toString('hex') : bytesToHex(compressed)
    headers[s] = !s || `${encodedValue}&${parseInt(v)}${v2}`
    delete headers[bHh]
  }
  return request(url, {
    ...options,
    method,
    headers: Object.assign({}, defaultHeaders, headers),
    timeout,
    agent: getRequestAgent(url),
    json: format === 'json',
  }, (err, resp, body) => {
    if (err) return callback(err, null)
    callback(null, resp, body)
  })
}

export const checkUrl = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    fetchData(url, 'head', options, (err, resp) => {
      if (err) return reject(err)
      if (resp.statusCode === 200) {
        resolve()
      } else {
        reject(new Error(resp.statusCode))
      }
    })
  })
}
