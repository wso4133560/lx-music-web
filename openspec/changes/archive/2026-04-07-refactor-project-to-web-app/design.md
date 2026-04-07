## Context

当前本地项目 `/home/tanglin/workspace2/lx-music-web` 采用 Electron 主进程与 Vue 渲染进程协同的运行模型。`src/main/index.ts` 负责启动应用与注册原生模块，`src/renderer/main.ts` 负责挂载 Vue 应用，但渲染层大量能力并不直接面向浏览器环境，而是通过 `src/renderer/utils/ipc.ts` 调用 `src/common/rendererIpc.ts` 暴露的 Electron IPC。

这导致当前 `src/renderer` 不能在没有 Electron preload 和主进程配合的情况下独立运行。与此同时，`src/main/**` 中还承载了托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、窗口控制、开放 API、用户 API 等桌面能力，其中相当一部分不适合进入第一阶段 Web 版本。

本次设计面向第一阶段重构目标：将当前项目演进为前后端分离的 Web 应用，保留搜索、在线播放、榜单、歌单列表与详情、歌单同步、下载能力、基础设置，排除本地音乐与各类桌面专属能力。该设计必须准确基于本地项目 `/home/tanglin/workspace2/lx-music-web` 的现有结构展开，不使用 Gemini MCP。

## Goals / Non-Goals

**Goals:**
- 使 `src/renderer` 可以在不存在 Electron preload、`ipcRenderer`、主进程窗口环境的情况下独立启动。
- 将当前集中在 `src/renderer/utils/ipc.ts` 的平台能力抽象为统一接口，并允许分别接入 Web 与桌面实现。
- 将搜索、在线播放、榜单、歌单列表/详情、歌单同步、下载能力、基础设置定义为第一阶段 Web 主闭环。
- 将歌单同步与下载能力从 Electron IPC 模型迁移为前后端 API 契约。
- 明确把桌面能力从 Web 第一阶段主路径中剥离，避免在页面层残留 Electron 运行时分支。

**Non-Goals:**
- 不在第一阶段保留本地音乐能力。
- 不在第一阶段保留托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、Electron 窗口特性。
- 不追求桌面版与 Web 版的完全运行时等价。
- 不在本次设计中定义 Gemini MCP 相关流程。

## Decisions

### 1. 采用“平台能力接口 + 多端适配器”方案，而不是在页面内做环境判断
- 决策：将 `src/renderer/utils/ipc.ts` 现有职责拆分为若干平台能力接口，由 Web 适配器与桌面适配器分别实现。
- 原因：当前渲染层并不是纯页面代码，而是直接使用 Electron IPC 封装。如果继续在组件与 composable 中散布 `if (isWeb)` / `if (isElectron)` 判断，会把耦合从底层搬到页面层，后续维护成本更高。
- 替代方案：
  - 方案 A：保留现有 `ipc.ts`，仅在内部加 web fallback。放弃，因接口语义已深度绑定 Electron 事件模型。
  - 方案 B：按能力域拆分接口。采用，因为更容易将搜索播放、同步、下载、设置分阶段迁移。

### 2. 第一阶段以复用 `src/renderer` 的页面结构为主，不重写产品界面
- 决策：保留现有 Vue 路由、视图和大部分页面结构，以能力抽离替代界面重做。
- 原因：`src/renderer/router.ts`、`src/renderer/views/**` 已具备完整信息架构，重写 UI 只会扩大范围，不利于快速形成 Web 可运行主闭环。
- 替代方案：
  - 全量重写前端。放弃，因为与“先建立 Web 运行闭环”的目标冲突。
  - 保留现有页面并替换底层依赖。采用，因为风险更可控。

### 3. 同步与下载统一迁移为 API 契约，不再保留 Electron IPC 语义
- 决策：第一阶段把同步与下载定义为 Web 前端调用的服务接口，由后端承接。
- 原因：这两类能力都需要跨运行环境稳定工作，继续沿用 `rendererInvoke` / `rendererSend` 事件模型，会让 Web 版本继续依赖桌面进程概念。
- 替代方案：
  - 前端直接模拟 IPC 调用。放弃，因为无法形成真正的前后端分离边界。
  - 后端 API 化。采用，因为更符合 Web 目标形态。

### 4. 将桌面能力明确标记为“第一阶段排除项”，不做半兼容保留
- 决策：对托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、Electron 窗口特性，第一阶段直接排除，而不是保留失效入口。
- 原因：这些能力广泛分布于 `src/main/**`，若做半兼容占位，会在 Web 版中残留大量不可验证路径。
- 替代方案：
  - 保留入口并显示不可用。部分可作为过渡，但不应成为核心设计目标。
  - 在第一阶段从 Web 主路径中移除。采用。

### 5. 本地音乐直接排除，不做浏览器临时兼容版本
- 决策：第一阶段不包含本地音乐，不引入浏览器文件导入或服务端媒体库方案。
- 原因：你已明确选择将本地音乐放到后续阶段，继续纳入会显著扩大本次重构边界。
- 替代方案：
  - 浏览器导入模式。放弃。
  - 服务端媒体库模式。放弃。
  - 第一阶段排除。采用。

## Risks / Trade-offs

- [渲染层隐藏耦合超出 `src/renderer/utils/ipc.ts` 预期] → 通过逐步梳理 `src/renderer/core/**`、`src/renderer/event/**`、`window.lx` 相关调用，补齐平台能力清单。
- [同步与下载 API 化后，前后端契约设计不清会导致返工] → 先通过 spec 明确行为边界与成功场景，再进入实现。
- [保留现有页面结构可能继承部分桌面交互假设] → 在迁移过程中明确标记 Web 版禁止继续依赖窗口控制、托盘、桌面歌词等交互。
- [第一阶段排除本地音乐与桌面特性会造成能力收缩] → 通过 proposal 与 spec 明确这是阶段性范围控制，而不是永久删除。
- [同时支持桌面与 Web 适配层会增加抽象成本] → 通过按能力域拆分接口控制复杂度，不做一次性总抽象。

## Migration Plan

1. 识别并整理 `src/renderer` 当前直接依赖 Electron IPC 与全局桌面运行时的能力清单。
2. 建立平台能力接口边界，确定哪些能力进入 Web 第一阶段主闭环，哪些能力为桌面专属。
3. 为 Web 第一阶段的搜索播放、设置、同步、下载定义前端调用方式与 API 契约。
4. 逐步将 `src/renderer` 启动链路从 Electron preload 依赖切换到平台适配器依赖。
5. 清理或隔离本地音乐与各类桌面专属入口，保证 Web 版主路径可验证。
6. 在实现阶段完成逐步迁移；如中途失败，可回退到原 Electron 路径，因为本次设计不要求一次性移除桌面实现。

## Phase 1 Migration Notes

### Confirmed exclusions in the Web first phase

- 本地音乐仍视为桌面专属能力，相关入口与文件读取链路不进入 Web 主路径。
- 备份导入导出、歌单文件导入导出、自定义音源本地文件导入、主题背景图选择仍依赖桌面文件系统，只保留桌面实现。
- 托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、窗口控制按钮与窗口尺寸控制不属于 Web 第一阶段的必需能力。

### Renderer-facing platform boundaries

- 搜索播放主路径中的列表过滤、排序、去重、搜索与拖拽重排统一收口到 `src/renderer/platform/list.ts`。
- 下载与同步能力分别收口到 `src/renderer/platform/download.ts`、`src/renderer/platform/sync.ts`，Web 通过浏览器能力或 HTTP API 工作，桌面继续复用原实现。
- 桌面文件能力统一收口到 `src/renderer/platform/desktopFiles.ts`，其余渲染层业务模块不再直接调用 `window.lx.worker.main`。

### Follow-up extension points

- 若后续阶段要恢复本地音乐，应优先扩展 `src/renderer/platform/desktopFiles.ts` 或新增独立平台接口，而不是重新把文件系统调用散落回页面组件。
- 若后续阶段要支持 Web 侧主题背景图、自定义音源导入或备份恢复，应以浏览器 `File`/上传接口或后端存储 API 为新契约，而不是继续沿用 Electron 文件对话框语义。
- 若后续阶段要进一步削减桌面分支，可继续把 `src/renderer/utils/ipc.ts` 中剩余的桌面专属辅助能力迁移到更细粒度的平台模块。

## Validation Notes

- 已补充 `scripts/validate-web-phase1.mjs` 作为第一阶段 Web 主路径的静态验证脚本，并通过 `npm run validate:web-phase1` 执行。
- 当前脚本覆盖的验证点包括：首阶段保留路由、导航入口、桌面专属设置与初始化逻辑的懒加载、同步 API 契约、下载 Web 存储与浏览器下载路径、以及目标目录内活跃 `@renderer/utils/ipc` 直接调用清理结果。
- 由于当前工作区缺少依赖安装与完整构建环境，本轮验证仍以静态校验为主，不替代后续真实浏览器 / 后端联调验证。

## Open Questions

- Web 第一阶段后端由当前仓库内新增服务承接，还是拆为独立服务仓库承接？
- 下载能力在第一阶段是仅要求“发起下载并获得状态反馈”，还是需要完整下载任务管理？
- 同步能力是沿用现有同步协议抽象为 HTTP/WebSocket 接口，还是定义全新接口并做兼容迁移？
- 设置能力中哪些项属于 Web 版必须保留，哪些项实际上依赖桌面运行时，应在实现前进一步裁剪？
