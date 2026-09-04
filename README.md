# SSH Connection Sound

[![CI](https://github.com/omarZACK/vscode-ssh-connection-sound/actions/workflows/ci.yml/badge.svg)](https://github.com/omarZACK/vscode-ssh-connection-sound/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/omarZACK/vscode-ssh-connection-sound)](https://github.com/omarZACK/vscode-ssh-connection-sound/releases/latest)
[![License](https://img.shields.io/github/license/omarZACK/vscode-ssh-connection-sound)](https://github.com/omarZACK/vscode-ssh-connection-sound/blob/main/LICENSE)

A cross-platform VS Code extension that plays sounds for
**Remote-SSH connection success, failure testing, and disconnect events**.

The extension runs as a **UI extension**, so sound playback happens on
your local computer rather than on the remote SSH server.

---

## Features

- Remote-SSH connection success sound
- Remote-SSH disconnect sound
- Success sound test command
- Failure sound test command
- Disconnect sound test command
- Reload sounds configuration without restarting VS Code
- Windows support
- macOS support
- Linux support
- Custom sound configuration
- Native operating-system sound support
- Multiple Linux playback backends
- Configurable polling interval
- No external runtime npm dependencies
- Runs locally when using Remote-SSH

---

## Download

### Latest VSIX

[![Download Latest VSIX](https://img.shields.io/github/v/release/omarZACK/vscode-ssh-connection-sound?label=Download%20VSIX)](https://github.com/omarZACK/vscode-ssh-connection-sound/releases/latest)

Download the latest `.vsix` package from the
**[GitHub Releases](https://github.com/omarZACK/vscode-ssh-connection-sound/releases/latest)** page.

The release assets contain the installable VS Code extension:

```text
ssh-connection-sound-X.Y.Z.vsix
```

---

## Installation

### Option 1 — Install the VSIX from the terminal

After downloading the `.vsix` file:

```bash
code --install-extension ssh-connection-sound-0.0.3.vsix
```

### Option 2 — Install from VS Code

1. Open VS Code.
2. Open the **Extensions** view.
3. Click the `...` menu.
4. Select **Install from VSIX...**
5. Select the downloaded `.vsix` file.
6. Reload VS Code if requested.

---

## Supported Operating Systems

### Windows

Supported:

- Windows 10
- Windows 11

Windows uses native `.NET SystemSounds` for configured system sounds.

Custom sound files can also be configured as `.wav` files.

---

### macOS

macOS uses the built-in:

```text
afplay
```

System sound files can be configured using `.aiff` files.

---

### Linux

The extension supports common Linux audio playback utilities:

- `paplay`
- `aplay`
- `ffplay`
- `canberra-gtk-play`

It also checks several common locations for desktop notification sounds.

Supported distributions include:

- Ubuntu
- Debian
- Fedora
- Arch Linux
- Other Linux distributions with a supported audio playback utility

---

## How It Works

The extension monitors the VS Code remote environment:

```javascript
vscode.env.remoteName;
```

When VS Code enters a Remote-SSH environment, the extension detects the SSH connection and plays the configured success sound.

When the Remote-SSH environment disappears, the extension detects the disconnect and plays the configured disconnect sound.

The extension is configured as a UI extension:

```json
"extensionKind": [
  "ui"
]
```

This is important because the extension needs to play audio through the **local computer's audio system**.

The remote SSH server does not need to have the sound files or audio playback utilities installed.

---

## Sound Configuration

Sound configuration is stored in:

```text
sounds.json
```

The bundled configuration contains platform-specific sounds.

Example structure:

```json
{
    "windows": {
        "success": {
            "type": "system",
            "sound": "Asterisk"
        },
        "failure": {
            "type": "system",
            "sound": "Hand"
        },
        "disconnect": {
            "type": "system",
            "sound": "Exclamation"
        }
    },

    "macos": {
        "success": {
            "type": "file",
            "path": "/System/Library/Sounds/Glass.aiff"
        },
        "failure": {
            "type": "file",
            "path": "/System/Library/Sounds/Basso.aiff"
        },
        "disconnect": {
            "type": "file",
            "path": "/System/Library/Sounds/Submarine.aiff"
        }
    },

    "linux": {
        "success": {
            "type": "file",
            "paths": [
                "/usr/share/sounds/freedesktop/stereo/complete.oga",
                "/usr/share/sounds/freedesktop/stereo/message-new-instant.oga",
                "/usr/share/sounds/freedesktop/stereo/dialog-information.oga"
            ]
        },
        "failure": {
            "type": "file",
            "paths": [
                "/usr/share/sounds/freedesktop/stereo/dialog-error.oga",
                "/usr/share/sounds/freedesktop/stereo/dialog-warning.oga"
            ]
        },
        "disconnect": {
            "type": "file",
            "paths": [
                "/usr/share/sounds/freedesktop/stereo/service-logout.oga",
                "/usr/share/sounds/freedesktop/stereo/device-removed.oga"
            ]
        }
    }
}
```

---

## Custom Sounds

You can provide your own `sounds.json` file.

In VS Code settings, configure:

```text
SSH Connection Sound: Sounds File
```

or use:

```json
{
    "sshConnectionSound.soundsFile": "/path/to/your/sounds.json"
}
```

The extension also supports:

```text
~/path/to/sounds.json
```

and relative paths.

After changing the file, use:

```text
SSH Connection Sound: Reload Sounds
```

to reload the configuration.

---

## VS Code Settings

The extension provides the following settings.

### Enable or Disable Sounds

Setting:

```text
sshConnectionSound.enabled
```

Default:

```json
true
```

Example:

```json
{
    "sshConnectionSound.enabled": true
}
```

---

### Custom Sounds File

Setting:

```text
sshConnectionSound.soundsFile
```

Default:

```text
""
```

An empty value uses the bundled `sounds.json`.

Example:

```json
{
    "sshConnectionSound.soundsFile": "/home/user/.config/ssh-sounds.json"
}
```

---

### Polling Interval

Setting:

```text
sshConnectionSound.pollInterval
```

Default:

```text
500
```

The value is specified in milliseconds.

Example:

```json
{
    "sshConnectionSound.pollInterval": 500
}
```

The minimum supported value is:

```text
100 ms
```

---

## Commands

Open the VS Code Command Palette:

```text
Ctrl+Shift+P
```

or on macOS:

```text
Cmd+Shift+P
```

Available commands:

### Test Success Sound

```text
SSH Connection Sound: Test Success Sound
```

Immediately tests the configured success sound.

---

### Test Failure Sound

```text
SSH Connection Sound: Test Failure Sound
```

Immediately tests the configured failure sound.

---

### Test Disconnect Sound

```text
SSH Connection Sound: Test Disconnect Sound
```

Immediately tests the configured disconnect sound.

---

### Reload Sounds

```text
SSH Connection Sound: Reload Sounds
```

Reloads the configured `sounds.json` file.

This allows sound configuration changes without restarting VS Code.

---

## Remote-SSH Usage

Install the extension on your local VS Code installation.

Then connect to a remote machine using:

```text
Remote-SSH: Connect to Host...
```

The extension runs locally and monitors the VS Code remote environment.

Example:

```text
Local Computer
│
├── VS Code
│   └── SSH Connection Sound
│
└── Audio Output
    └── Speakers / Headphones
            │
            │
            ▼
       Remote SSH Server
```

The audio is played locally.

You do not need to install this extension separately on the remote server.

---

## Failure Detection

VS Code's public extension API does not expose the complete internal
Remote-SSH connection log stream.

Therefore, the extension can reliably detect:

- Remote-SSH connection success
- Remote-SSH disconnect

The failure sound is available through the test command.

Automatic detection of every possible Remote-SSH failure is not guaranteed
because Remote-SSH's internal connection logs are not exposed as a stable
public VS Code API.

---

## Development

Clone the repository:

```bash
git clone https://github.com/omarZACK/vscode-ssh-connection-sound.git
cd vscode-ssh-connection-sound
```

Install the VS Code Extension Manager:

```bash
npm install -g @vscode/vsce
```

Package the extension:

```bash
vsce package
```

This generates:

```text
ssh-connection-sound-X.Y.Z.vsix
```

Install the local package:

```bash
code --install-extension ./ssh-connection-sound-X.Y.Z.vsix
```

---

## Project Structure

```text
vscode-ssh-sound/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── .vscode/
│   ├── extensions.json
│   └── launch.json
│
├── assets/
│   └── icon.png
│
├── config/
│   └── sounds.json
│
├── src/
│   ├── extension.js
│   ├── audio/
│   │   ├── player.js
│   │   ├── linux.js
│   │   ├── macos.js
│   │   └── windows.js
│   ├── config/
│   │   └── loader.js
│   └── remote/
│       └── monitor.js
│
├── test/
│   └── extension.test.js
│
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
└── .vscodeignore
```

---

## GitHub Actions

The repository uses GitHub Actions for automated validation and releases.

### Continuous Integration

The CI workflow validates:

- `package.json`
- `sounds.json`
- `extension.js`
- VSIX packaging

It runs on pushes to `main` and pull requests targeting `main`.

### Releases

A release is created automatically when a version tag is pushed:

```text
v0.0.3
v0.0.4
v0.1.0
...
```

The release workflow:

1. Checks out the repository.
2. Installs Node.js.
3. Installs `vsce`.
4. Verifies that the Git tag matches `package.json`.
5. Builds the `.vsix`.
6. Creates a GitHub Release.
7. Uploads the `.vsix` as a release asset.
8. Generates GitHub release notes.

---

## Creating a Release

Update the version in:

```text
package.json
```

For example:

```json
"version": "0.0.4"
```

Commit the change:

```bash
git add package.json
git commit -m "chore: bump version to 0.0.4"
git push origin main
```

Create the Git tag:

```bash
git tag v0.0.4
git push origin v0.0.4
```

GitHub Actions will automatically build and publish:

```text
ssh-connection-sound-0.0.4.vsix
```

---

## Manual Packaging

You can always build the VSIX locally:

```bash
vsce package
```

Inspect the files included in the package:

```bash
vsce ls
```

Install the generated package:

```bash
code --install-extension ./ssh-connection-sound-0.0.3.vsix
```

---

## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for details.

---

## Repository

GitHub:

https://github.com/omarZACK/vscode-ssh-connection-sound

Releases:

https://github.com/omarZACK/vscode-ssh-connection-sound/releases

Latest release:

https://github.com/omarZACK/vscode-ssh-connection-sound/releases/latest

---

## Author

**Omar Wawy**

GitHub:

https://github.com/omarZACK
