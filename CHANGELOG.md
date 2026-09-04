# Changelog

All notable changes to this project will be documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2026-09-04

### Added

- Reorganized the extension into a standard VS Code project structure.
- Added separated audio platform modules.
- Added dedicated Remote-SSH monitoring module.
- Added dedicated sound configuration loader.
- Added basic automated tests.
- Added VS Code Extension Development Host configuration.
- Added extension icon under `assets/icon.png`.

### Changed

- Moved the VS Code extension entry point to `src/extension.js`.
- Moved sound configuration to `config/sounds.json`.
- Improved separation between VS Code, audio, configuration, and Remote-SSH logic.

## [0.0.3]

### Added

- Remote-SSH connection success sound.
- Remote-SSH disconnect sound.
- Success sound test command.
- Failure sound test command.
- Disconnect sound test command.
- Custom `sounds.json` support.
- Configurable polling interval.
- Cross-platform audio support.
- GitHub Actions CI and release automation.
