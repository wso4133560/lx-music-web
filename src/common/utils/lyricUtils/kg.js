import { inflate } from 'zlib'
import { decodeName } from './util'

const createUint8Array = (value, encoding = 'utf8') => {
  if (typeof Buffer != 'undefined') return Buffer.from(value, encoding)
  if (value instanceof Uint8Array) return value
  if (Array.isArray(value)) return Uint8Array.from(value)
  if (typeof value != 'string') return new Uint8Array()
  if (encoding == 'base64') return Uint8Array.from(atob(value), char => char.charCodeAt(0))
  return new TextEncoder().encode(value)
}
const decodeText = (value, encoding = 'utf8') => {
  if (typeof Buffer != 'undefined') return Buffer.from(value, encoding).toString()
  const bytes = createUint8Array(value, encoding)
  return encoding == 'base64'
    ? new TextDecoder().decode(bytes)
    : new TextDecoder().decode(bytes)
}
const inflateData = (data) => new Promise((resolve, reject) => {
  if (typeof DecompressionStream != 'undefined') {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'))
    new Response(stream).text().then(resolve).catch(reject)
    return
  }
  inflate(data, (err, result) => {
    if (err) return reject(err)
    resolve(result.toString())
  })
})

// https://github.com/lyswhut/lx-music-desktop/issues/296#issuecomment-683285784
const enc_key = createUint8Array([0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69], 'binary')
const decodeLyric = str => new Promise((resolve, reject) => {
  if (!str.length) return
  const buf_str = createUint8Array(str, 'base64').subarray(4)
  for (let i = 0, len = buf_str.length; i < len; i++) {
    buf_str[i] = buf_str[i] ^ enc_key[i % 16]
  }
  inflateData(buf_str).then(resolve).catch(reject)
})

const headExp = /^.*\[id:\$\w+\]\n/

const parseLyric = str => {
  str = str.replace(/\r/g, '')
  if (headExp.test(str)) str = str.replace(headExp, '')
  let trans = str.match(/\[language:([\w=\\/+]+)\]/)
  let lyric
  let rlyric
  let tlyric
  if (trans) {
    str = str.replace(/\[language:[\w=\\/+]+\]\n/, '')
    let json = JSON.parse(decodeText(trans[1], 'base64'))
    for (const item of json.content) {
      switch (item.type) {
        case 0:
          rlyric = item.lyricContent
          break
        case 1:
          tlyric = item.lyricContent
          break
      }
    }
  }
  let i = 0
  let lxlyric = str.replace(/\[((\d+),\d+)\].*/g, str => {
    let result = str.match(/\[((\d+),\d+)\].*/)
    let time = parseInt(result[2])
    let ms = time % 1000
    time /= 1000
    let m = parseInt(time / 60).toString().padStart(2, '0')
    time %= 60
    let s = parseInt(time).toString().padStart(2, '0')
    time = `${m}:${s}.${ms}`
    if (rlyric) rlyric[i] = `[${time}]${rlyric[i]?.join('') ?? ''}`
    if (tlyric) tlyric[i] = `[${time}]${tlyric[i]?.join('') ?? ''}`
    i++
    return str.replace(result[1], time)
  })
  rlyric = rlyric ? rlyric.join('\n') : ''
  tlyric = tlyric ? tlyric.join('\n') : ''
  lxlyric = lxlyric.replace(/<(\d+,\d+),\d+>/g, '<$1>')
  lxlyric = decodeName(lxlyric)
  lyric = lxlyric.replace(/<\d+,\d+>/g, '')
  rlyric = decodeName(rlyric)
  tlyric = decodeName(tlyric)
  return {
    lyric,
    tlyric,
    rlyric,
    lxlyric,
  }
}


export const decodeKrc = async(data) => {
  return decodeLyric(data).then(parseLyric)
}
