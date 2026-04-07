export const isElectronRuntime = !!(window as any).require?.('electron')
export const isWebRuntime = !isElectronRuntime

export const supportsDesktopWindowControls = isElectronRuntime
export const supportsDesktopLyric = isElectronRuntime
export const supportsLocalMusic = isElectronRuntime
export const supportsListImportExport = isElectronRuntime
export const supportsThemeEditing = isElectronRuntime
export const supportsThemeBackgroundImage = isElectronRuntime
export const supportsUserApiManagement = true
export const supportsAppUpdates = isElectronRuntime
export const supportsDownloadSavePath = isElectronRuntime
export const supportsDownloadMetadataEmbedding = isElectronRuntime
export const supportsDownloadLyricFiles = isElectronRuntime

export const desktopOnlySettingSections = new Set([
  'SettingDesktopLyric',
  'SettingHotKey',
  'SettingOpenAPI',
  'SettingBackup',
  'SettingOther',
  'SettingUpdate',
])

export const isSettingSectionEnabled = (sectionId: string) => {
  if (!isWebRuntime) return true
  return !desktopOnlySettingSections.has(sectionId)
}
