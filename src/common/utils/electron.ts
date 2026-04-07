const getElectron = () => {
  return (window as any).require?.('electron') ?? null
}

/**
 * 在资源管理器中打开目录
 * @param {string} dir
 */
export const openDirInExplorer = (dir: string) => {
  const shell = getElectron()?.shell
  if (shell) shell.showItemInFolder(dir)
}


/**
 * 在浏览器打开URL
 * @param {*} url
 */
export const openUrl = async(url: string) => {
  if (!/^https?:\/\//.test(url)) return
  const shell = getElectron()?.shell
  if (shell) {
    await shell.openExternal(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}


/**
 * 复制文本到剪贴板
 * @param str
 */
export const clipboardWriteText = (str: string) => {
  const clipboard = getElectron()?.clipboard
  if (clipboard) {
    clipboard.writeText(str)
    return
  }
  void navigator.clipboard?.writeText(str)
}

/**
 * 从剪贴板读取文本
 * @returns
 */
export const clipboardReadText = (): string => {
  const clipboard = getElectron()?.clipboard
  if (clipboard) return clipboard.readText()
  return ''
}


export const encodePath = (path: string) => {
  // https://github.com/lyswhut/lx-music-desktop/issues/963
  // https://github.com/lyswhut/lx-music-desktop/issues/1461
  return path.replaceAll('%', '%25').replaceAll('#', '%23')
}
