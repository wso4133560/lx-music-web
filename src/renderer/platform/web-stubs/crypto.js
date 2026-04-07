import md5 from 'crypto-js/md5'
import sha1 from 'crypto-js/sha1'
import sha256 from 'crypto-js/sha256'

const hashers = {
  md5,
  sha1,
  sha256,
}

export const createHash = (algorithm) => {
  let content = ''
  return {
    update(value) {
      content += typeof value == 'string' ? value : String(value)
      return this
    },
    digest(encoding) {
      const hasher = hashers[algorithm]
      if (!hasher) throw new Error(`Web runtime does not support hash algorithm: ${algorithm}`)
      const result = hasher(content).toString()
      if (encoding == 'hex' || encoding == null) return result
      return result
    },
  }
}

const unsupportedCipher = (mode) => ({
  update() {
    throw new Error(`Web runtime does not support ${mode}`)
  },
  final() {
    return ''
  },
})

export const createCipheriv = (mode) => unsupportedCipher(`createCipheriv(${mode})`)
export const createDecipheriv = (mode) => unsupportedCipher(`createDecipheriv(${mode})`)
export const publicEncrypt = () => {
  throw new Error('Web runtime does not support publicEncrypt')
}
export const randomBytes = (size) => {
  const bytes = new Uint8Array(size)
  globalThis.crypto?.getRandomValues?.(bytes)
  return bytes
}
export const constants = {
  RSA_NO_PADDING: 0,
}

export default {
  createHash,
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  randomBytes,
  constants,
}
