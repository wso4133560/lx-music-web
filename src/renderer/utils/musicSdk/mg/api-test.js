import { buildWebProxyUrl, httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { timeout } from '../options'
import getSongId from './songId'

const typeMap = {
  '128k': 'PQ',
  '320k': 'HQ',
  flac: 'SQ',
  flac24bit: 'ZQ',
}

const api_test = {
  getMusicUrl(songInfo, type) {
    let requestObj
    const toneFlag = typeMap[type] || typeMap['128k']
    return {
      cancelHttp() {
        requestObj?.cancelHttp?.()
      },
      promise: getSongId(songInfo).then(songId => {
        requestObj = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/listen-url?netType=00&resourceType=2&songId=${songId}&toneFlag=${toneFlag}`, {
          method: 'get',
          timeout,
          headers: {
            channel: '0146921',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
          },
        })
        return requestObj.promise
      }).then(({ statusCode, body }) => {
        if (statusCode == 429) return Promise.reject(new Error(requestMsg.tooManyRequests))
        if (!body || body.code !== '000000' || !body.data?.url) {
          return Promise.reject(new Error(body?.info || requestMsg.fail))
        }
        return {
          type,
          // Web audio playback must stay same-origin, otherwise the browser blocks the media request.
          url: buildWebProxyUrl(body.data.url),
        }
      }),
    }
  },
}

export default api_test
