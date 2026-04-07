## ADDED Requirements

### Requirement: Basic settings work in the Web runtime
The system SHALL support basic settings in the first-phase Web application without requiring Electron IPC.

#### Scenario: User reads current settings in Web runtime
- **WHEN** the first-phase Web application initializes
- **THEN** it can read the settings required for supported first-phase behavior without calling Electron IPC wrappers

#### Scenario: User updates a supported setting in Web runtime
- **WHEN** a user changes a supported first-phase setting
- **THEN** the new value is applied through the Web-compatible settings runtime

### Requirement: Web settings persistence is defined independently of Electron storage access
The system SHALL define a Web-compatible persistence path for supported first-phase settings instead of depending on the existing Electron-specific storage path.

#### Scenario: Supported setting is persisted in Web runtime
- **WHEN** a supported first-phase setting is changed in the Web application
- **THEN** the setting is persisted through the Web-compatible settings mechanism

### Requirement: Desktop-dependent settings are not required in the Web first phase
The system SHALL not require first-phase Web support for settings that depend on tray, global shortcuts, desktop lyric, automatic update, deeplink or protocol registration, local music, or Electron window behavior.

#### Scenario: Web settings scope is validated
- **WHEN** the settings surface for the first-phase Web application is reviewed
- **THEN** settings that depend on excluded desktop-only capabilities are outside the required scope
