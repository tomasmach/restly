# Changelog

## v1.0.2 - 2026-04-29

### Added
- Persist active timer state across app restarts.
- Show timer overrun state after the countdown passes zero.

### Fixed
- Await active timer persistence updates to avoid stale timer state.
- Resolve high-severity npm audit finding by updating Expo-related packages.

### Changed
- Bump Expo-related dependencies and refresh `package-lock.json`.
