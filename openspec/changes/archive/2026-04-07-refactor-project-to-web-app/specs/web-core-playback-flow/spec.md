## ADDED Requirements

### Requirement: Web first phase preserves the core online playback flow
The system SHALL preserve the first-phase user flow for search, leaderboard browsing, song list browsing, song list detail viewing, and online playback in the Web application.

#### Scenario: User completes the primary online music flow
- **WHEN** a user opens the first-phase Web application
- **THEN** the user can search for music, browse leaderboards, browse song lists, view song list details, and play online music without depending on Electron runtime features

### Requirement: Existing renderer information architecture remains recognizable
The system SHALL preserve the existing renderer information architecture derived from `/home/tanglin/workspace2/lx-music-web/src/renderer/router.ts` for the first-phase Web application unless a route depends on a removed first-phase capability.

#### Scenario: Web routes are mapped from existing renderer routes
- **WHEN** first-phase Web routes are defined
- **THEN** the routes corresponding to search, leaderboard, song list list, and song list detail remain available in the Web application

### Requirement: Local music is excluded from the first-phase Web application
The system SHALL not include local music capability in the first-phase Web application.

#### Scenario: User enters the first-phase Web application
- **WHEN** the application renders first-phase capabilities
- **THEN** local music is not required, exposed, or treated as part of the supported feature set
