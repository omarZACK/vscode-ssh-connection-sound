# SSH Connection Sound

A cross-platform VS Code extension that plays sounds when a
Remote-SSH connection succeeds or disconnects.

The extension runs as a **UI extension**, so sound playback happens
on your local computer rather than on the remote SSH server.

## Features

- Remote-SSH connection success sound
- Remote-SSH disconnect sound
- Failure sound test command
- Success sound test command
- Disconnect sound test command
- Windows support
- macOS support
- Linux support
- Custom sound files
- Native OS fallback sounds
- No external npm runtime dependencies
- Configurable polling interval

## Supported Operating Systems

### Windows

Supported versions:

- Windows 10
- Windows 11

Windows uses native `.NET SystemSounds` by default.

Custom sound files can be configured as `.wav` files.

### macOS

Supported versions:

- macOS

macOS uses the built-in `afplay` utility and system sounds.

### Linux

Supported distributions include:

- Ubuntu
- Debian
- Fedora
- Arch Linux
- Other Linux distributions with `paplay`, `aplay`,
  `ffplay`, or `canberra-gtk-play`

The extension checks several common Linux sound locations.

## How It Works

The extension monitors:

```text
vscode.env.remoteName