const WEB_STORAGE_PREFIX = 'lx:web:'

const getStorageKey = (key: string) => `${WEB_STORAGE_PREFIX}${key}`

export const readWebStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(getStorageKey(key))
    return value == null ? fallback : JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const writeWebStorage = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(value))
  } catch {
    // Ignore storage quota / privacy mode errors and keep runtime usable.
  }
}
