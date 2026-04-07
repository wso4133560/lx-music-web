## ADDED Requirements

### Requirement: Renderer can boot without Electron runtime
The system SHALL allow the application code under `/home/tanglin/workspace2/lx-music-web/src/renderer` to start and mount without requiring Electron preload objects, Electron IPC objects, or a running Electron main process.

#### Scenario: Web runtime starts renderer
- **WHEN** the Web runtime loads the renderer entry derived from `/home/tanglin/workspace2/lx-music-web/src/renderer/main.ts`
- **THEN** the application starts without importing `ipcRenderer`, `BrowserWindow`, or Electron preload globals during boot

### Requirement: Platform capabilities are exposed through explicit interfaces
The system SHALL replace the Electron-specific capability access concentrated in `/home/tanglin/workspace2/lx-music-web/src/renderer/utils/ipc.ts` with explicit platform capability interfaces grouped by domain.

#### Scenario: Renderer requests a platform capability
- **WHEN** a renderer module needs settings, synchronization, download, or external action capabilities
- **THEN** it consumes a domain interface instead of directly calling Electron IPC wrapper functions

### Requirement: Web and desktop implementations are isolated behind the same contracts
The system SHALL provide separate implementations for Web and desktop runtimes behind the same renderer-facing capability contracts.

#### Scenario: Runtime selects a platform implementation
- **WHEN** the application runs in a Web environment
- **THEN** the renderer receives the Web implementation of the platform capability contracts

#### Scenario: Desktop runtime remains supported
- **WHEN** the application runs in the existing desktop environment
- **THEN** the renderer can still receive a desktop implementation without changing feature-level renderer code

### Requirement: Desktop-only capabilities are excluded from the Web first phase main path
The system SHALL exclude tray, global shortcuts, desktop lyric, automatic update, deeplink or protocol registration, and Electron window features from the first-phase Web main path.

#### Scenario: Web build reaches a desktop-only feature boundary
- **WHEN** the Web application encounters a feature that depends on tray, global shortcuts, desktop lyric, automatic update, deeplink or protocol registration, or Electron window behavior
- **THEN** that feature is not part of the first-phase Web main path and is not required for successful Web operation
