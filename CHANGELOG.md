# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-28

### Added
- Added user data migration from `whatsapp-linux-client` to `openwhats` to preserve existing sessions after the rename.
- Added a tray icon menu with quick actions to show OpenWhats or quit the app.
- Added privacy blur when the app window loses focus.
- Added automatic update checks through `electron-updater`.
- Enabled spellcheck in the Electron web preferences.

### Changed
- Renamed the application from `whatsapp-linux-client` / `WhatsApp Desktop` to `OpenWhats`.
- Updated app identifiers and package metadata to use `openwhats` and `io.github.kevelino.openwhats`.
- Translated runtime logs and tray labels in `main.js` to English.

### Fixed
- Updated Snap packaging to use a newer `core22` base without the legacy template runtime, improving startup compatibility on newer Ubuntu releases.

## [1.0.2] - 2026-05-22

### Added
- Created `FEATURES.md` to document exclusive application features in detail.
- Integrated Snap Store badges and links into `README.md`.
- Expanded and enhanced the application icon set.

## [1.0.1] - 2026-05-19

### Changed
- Renamed the application npm package and name to `whatsapp-linux-client`.

### Fixed
- Moved runtime libraries (`electron-context-menu` and `electron-window-state`) from `devDependencies` to production `dependencies` to ensure proper packaging and bundling.
- Added author email requirement to meet `.deb` maintainer packaging specifications.

## [1.0.0] - 2026-05-19

### Added
- Initial release of the lightweight, unofficial WhatsApp desktop wrapper for Linux.
- Custom User-Agent configuration to bypass WhatsApp Web's browser restrictions.
- Integrated window state management to remember window dimensions and position across sessions.
- Context menu support for right-click copy, paste, and save image actions.
- Package builds configured for `.AppImage`, `.deb`, and `.snap` distributions.
- Basic icon resources and comprehensive installation guide.
