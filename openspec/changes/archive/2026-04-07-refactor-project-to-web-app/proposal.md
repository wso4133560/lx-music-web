## Why

当前项目 `/home/tanglin/workspace2/lx-music-web` 是一个基于 Electron 与 Vue 3 的桌面应用，核心用户界面位于 `src/renderer`，但运行时能力大量依赖 `src/main` 与 `src/renderer/utils/ipc.ts` 提供的 Electron IPC。要将其演进为可在浏览器中运行的产品，必须先把桌面专属能力与可复用的前端业务界面拆开，建立面向 Web 的平台边界。

现在推进这项变更，是为了让现有搜索、在线播放、榜单、歌单、同步、下载等核心能力可以脱离 Electron 运行，并为后续前后端分离部署、Web 端持续迭代与多端复用建立稳定基础。

## What Changes

- 将 `/home/tanglin/workspace2/lx-music-web` 的第一阶段目标明确为“前后端分离的 Web 应用”，而不是继续围绕 Electron 桌面壳扩展。
- 抽离当前 `src/renderer/utils/ipc.ts` 承载的平台能力，建立面向 Web 与桌面双实现的统一能力接口。
- 使 `src/renderer` 可以在不存在 Electron preload 与主进程 IPC 的情况下独立启动。
- 为搜索、在线播放、榜单、歌单列表/详情、歌单同步、下载能力、基础设置定义可由 Web 前端消费的能力边界。
- 将同步能力与下载能力从当前 Electron IPC 语义迁移为明确的 API 契约。
- **BREAKING**：第一阶段 Web 版本不包含本地音乐能力。
- **BREAKING**：第一阶段 Web 版本不包含托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、Electron 窗口特性。
- 明确将 `src/main/**` 中的桌面专属能力排除出第一阶段 Web 主路径，只保留后续按需适配的扩展空间。
- 本次变更不使用 Gemini MCP，研究与设计输出基于本地项目代码与现有 OpenSpec 流程完成。

## Capabilities

### New Capabilities
- `web-platform-abstraction`: 定义将 `src/renderer` 与 Electron 运行时解耦的平台能力抽象，以及 Web 与桌面实现边界。
- `web-core-playback-flow`: 定义 Web 第一阶段必须保留的核心用户闭环，包括搜索、在线播放、榜单、歌单列表与歌单详情。
- `web-sync-and-download-api`: 定义歌单同步与下载能力在 Web 形态下的 API 契约与前后端交互边界。
- `web-settings-runtime`: 定义基础设置在 Web 环境下的读取、更新、持久化与运行时行为。

### Modified Capabilities

## Impact

- 主要受影响代码：`src/renderer/**`、`src/renderer/utils/ipc.ts`、`src/renderer/core/**`、`src/main/**`、`src/common/rendererIpc.ts`、`src/common/mainIpc.ts`、`src/common/ipcNames.ts`
- 受影响系统：Electron 主进程能力边界、Vue 渲染层启动流程、同步模块、下载模块、设置读写流程
- 受影响运行模型：从 Electron 主进程 + 渲染进程 IPC 模型，演进为 Web 前端 + 后端 API 模型
- 对现有桌面能力的影响：本地音乐、托盘、全局快捷键、桌面歌词、自动更新、deeplink/协议注册、Electron 窗口特性不进入第一阶段 Web 交付范围
- 后续设计与实现必须准确基于本地项目 `/home/tanglin/workspace2/lx-music-web` 的真实文件结构展开，不能将本地工程误写成在线检索项目
