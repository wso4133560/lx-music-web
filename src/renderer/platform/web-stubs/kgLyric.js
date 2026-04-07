import { decodeName } from '@common/utils/lyricUtils/util'

const encKey = Uint8Array.from([0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69])

const decodeBase64 = (value) => {
  if (typeof atob == 'function') return atob(value)
  return Buffer.from(value, 'base64').toString('binary')
}

const decodeLyric = async(str) => {
  if (!str.length) return ''
  const binary = decodeBase64(str)
  const encrypted = Uint8Array.from(binary, char => char.charCodeAt(0)).subarray(4)
  for (let index = 0; index < encrypted.length; index++) {
    encrypted[index] ^= encKey[index % encKey.length]
  }

  if (typeof DecompressionStream == 'undefined') {
    throw new Error('Web runtime missing DecompressionStream support')
  }

  const stream = new Blob([encrypted]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Response(stream).text()
}

const headExp = /^.*\[id:\$\w+\]\n/

const parseLyric = (str) => {
  str = str.replace(/\r/g, '')
  if (headExp.test(str)) str = str.replace(headExp, '')
  let trans = str.match(/\[language:([\w=\\/+]+)\]/)
  let lyric
  let rlyric
  let tlyric
  if (trans) {
    str = str.replace(/\[language:[\w=\\/+]+\]\n/, '')
    const json = JSON.parse(decodeBase64(trans[1]))
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
  let index = 0
  let lxlyric = str.replace(/\[((\d+),\d+)\].*/g, rawLine => {
    const result = rawLine.match(/\[((\d+),\d+)\].*/)
    let time = parseInt(result[2])
    const ms = time % 1000
    time /= 1000
    const minutes = parseInt(time / 60).toString().padStart(2, '0')
    time %= 60
    const seconds = parseInt(time).toString().padStart(2, '0')
    const formattedTime = `${minutes}:${seconds}.${ms}`
    if (rlyric) rlyric[index] = `[${formattedTime}]${rlyric[index]?.join('') ?? ''}`
    if (tlyric) tlyric[index] = `[${formattedTime}]${tlyric[index]?.join('') ?? ''}`
    index++
    return rawLine.replace(result[1], formattedTime)
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
