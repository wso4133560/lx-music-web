import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const checks = []

const pass = (name, details) => checks.push({ ok: true, name, details })
const fail = (name, details) => checks.push({ ok: false, name, details })

const expectIncludes = (source, snippet, name, details = snippet) => {
  if (source.includes(snippet)) pass(name, details)
  else fail(name, details)
}

const expectPathExists = (relativePath, name = `File exists: ${relativePath}`) => {
  if (exists(relativePath)) pass(name, relativePath)
  else fail(name, relativePath)
}

const collectFiles = (relativeDir) => {
  const base = path.join(root, relativeDir)
  const results = []
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(full)
      else results.push(path.relative(root, full))
    }
  }
  visit(base)
  return results
}

const router = read('src/renderer/router.ts')
const navBar = read('src/renderer/components/layout/Aside/NavBar.vue')
const appVue = read('src/renderer/App.vue')
const useApp = read('src/renderer/core/useApp/index.ts')
const useDataInit = read('src/renderer/core/useApp/useDataInit.ts')
const settingIndex = read('src/renderer/views/Setting/index.vue')
const settingBasic = read('src/renderer/views/Setting/components/SettingBasic.vue')
const listMenu = read('src/renderer/views/List/MyList/useMenu.js')
const syncPlatform = read('src/renderer/platform/sync.ts')
const downloadPlatform = read('src/renderer/platform/download.ts')
const downloadAction = read('src/renderer/store/download/action.ts')

for (const requiredRoute of ['/search', '/leaderboard', '/songList/list', '/songList/detail', '/list', '/download', '/setting']) {
  expectIncludes(router, `path: '${requiredRoute}'`, `Route preserved: ${requiredRoute}`)
}

for (const requiredNav of ['/search', '/songList/list', '/leaderboard', '/list', '/setting']) {
  expectIncludes(navBar, `to: '${requiredNav}'`, `Navigation entry preserved: ${requiredNav}`)
}
expectIncludes(navBar, "to: '/download'", 'Navigation keeps download entry')
expectIncludes(navBar, "enable: appSetting['download.enable']", 'Download nav remains setting-controlled')
expectIncludes(listMenu, '...(supportsLocalMusic ? [{', 'Local music menu is runtime-gated')

for (const viewFile of [
  'src/renderer/views/Search/index.vue',
  'src/renderer/views/Leaderboard/index.vue',
  'src/renderer/views/songList/List/index.vue',
  'src/renderer/views/songList/Detail/index.vue',
  'src/renderer/views/List/index.vue',
  'src/renderer/views/Download/index.vue',
  'src/renderer/views/Setting/index.vue',
]) {
  expectPathExists(viewFile)
}

expectIncludes(appVue, 'layout-change-log-modal v-if="supportsAppUpdates"', 'Update log modal is desktop-gated')
expectIncludes(appVue, 'layout-update-modal v-if="supportsAppUpdates"', 'Update modal is desktop-gated')

for (const dynamicImport of [
  "import('./useDeeplink')",
  "import('./useOpenAPI')",
  "import('./useStatusbarLyric')",
  "import('./useUpdate')",
]) {
  expectIncludes(useApp, dynamicImport, `Desktop-only app init is lazy-loaded: ${dynamicImport}`)
}
expectIncludes(useDataInit, "import('./useInitUserApi')", 'User API init is lazy-loaded')

for (const dynamicComponent of [
  "defineAsyncComponent(() => import('./components/SettingDesktopLyric.vue'))",
  "defineAsyncComponent(() => import('./components/SettingOpenAPI.vue'))",
  "defineAsyncComponent(() => import('./components/SettingHotKey.vue'))",
  "defineAsyncComponent(() => import('./components/SettingBackup.vue'))",
  "defineAsyncComponent(() => import('./components/SettingOther.vue'))",
  "defineAsyncComponent(() => import('./components/SettingUpdate.vue'))",
]) {
  expectIncludes(settingIndex, dynamicComponent, `Desktop-only setting panel is lazy-loaded: ${dynamicComponent}`)
}
for (const modalComponent of [
  './ThemeEditModal/index.vue',
  './UserApiModal.vue',
]) {
  expectIncludes(settingBasic, modalComponent, `Desktop-only setting modal is lazy-loaded: ${modalComponent}`)
}

expectIncludes(syncPlatform, "requestJson<Partial<SyncSnapshot>>('/api/sync/status')", 'Sync status uses Web API')
expectIncludes(syncPlatform, "requestJson<void>('/api/sync/action'", 'Sync actions use Web API')
expectIncludes(syncPlatform, "requestJson<LX.Sync.ServerDevices>('/api/sync/server/devices')", 'Sync server devices use Web API')
expectIncludes(syncPlatform, "method: 'DELETE'", 'Sync device removal uses DELETE contract')

expectIncludes(downloadPlatform, "const WEB_DOWNLOAD_TASKS_KEY = 'download_tasks'", 'Web download tasks persist in web storage')
expectIncludes(downloadPlatform, 'anchor.download = downloadInfo.metadata.fileName', 'Web download uses browser anchor download')
expectIncludes(downloadAction, 'await startBrowserDownload(downloadInfo)', 'Download action starts browser-native download in Web')
expectIncludes(downloadAction, 'setStatus(downloadInfo, DOWNLOAD_STATUS.COMPLETED)', 'Download action marks Web task complete')
expectIncludes(downloadAction, 'createPlatformDownloadTasks(list, quality', 'Web download creates runtime tasks from platform layer')

for (const desktopFlag of [
  'supportsLocalMusic = isElectronRuntime',
  'supportsListImportExport = isElectronRuntime',
  'supportsThemeEditing = isElectronRuntime',
  'supportsUserApiManagement = true',
  'supportsAppUpdates = isElectronRuntime',
]) {
  expectIncludes(read('src/renderer/platform/runtime.ts'), desktopFlag, `Runtime flag preserved: ${desktopFlag}`)
}

const ipcTargets = [
  'src/renderer/core',
  'src/renderer/views/Setting',
  'src/renderer/views/List',
  'src/renderer/components/layout',
]
const liveIpcImports = []
for (const dir of ipcTargets) {
  for (const file of collectFiles(dir)) {
    const content = read(file)
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (line.includes('@renderer/utils/ipc') && !line.trim().startsWith('//')) {
        liveIpcImports.push(`${file}:${index + 1}`)
      }
    })
  }
}
if (liveIpcImports.length === 0) pass('No active direct ipc imports remain in phase-1 target directories', 'clean')
else fail('No active direct ipc imports remain in phase-1 target directories', liveIpcImports.join(', '))

const failed = checks.filter(item => !item.ok)
for (const item of checks) {
  const mark = item.ok ? 'PASS' : 'FAIL'
  console.log(`${mark} ${item.name}${item.details ? ` :: ${item.details}` : ''}`)
}

if (failed.length) {
  console.error(`\nWeb phase-1 validation failed: ${failed.length} check(s) failed.`)
  process.exit(1)
}

console.log(`\nWeb phase-1 validation passed: ${checks.length} checks.`)
