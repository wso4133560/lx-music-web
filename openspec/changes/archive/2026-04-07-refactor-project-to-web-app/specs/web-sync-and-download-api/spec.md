## ADDED Requirements

### Requirement: Synchronization is exposed through Web-consumable APIs
The system SHALL expose playlist synchronization capabilities through explicit Web-consumable APIs instead of Electron IPC semantics.

#### Scenario: Web client performs synchronization action
- **WHEN** the first-phase Web client needs to read or update synchronization state
- **THEN** it uses a defined API contract rather than renderer-to-main Electron IPC events

### Requirement: Download capability is exposed through Web-consumable APIs
The system SHALL expose download capability through explicit Web-consumable APIs or download endpoints that the Web client can call.

#### Scenario: Web client starts a download-related action
- **WHEN** a user triggers a supported download action in the first-phase Web application
- **THEN** the client uses a defined API contract or endpoint rather than Electron IPC calls

### Requirement: Synchronization and download remain part of the first-phase Web scope
The system SHALL keep playlist synchronization and download capability within the first-phase Web delivery scope.

#### Scenario: First-phase Web scope is validated
- **WHEN** the first-phase Web scope is reviewed against supported capabilities
- **THEN** synchronization and download are included in the supported scope
