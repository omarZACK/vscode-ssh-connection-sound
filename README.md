# SSH Connection Sound

Play audio notifications when a VS Code Remote-SSH connection is established or disconnected.

The extension runs on the **local machine** so sounds are played through your local speakers/headphones rather than on the remote SSH server.

## Features

- Play a sound when a Remote-SSH connection succeeds.
- Play a sound when a Remote-SSH connection disconnects.
- Manually test success, failure, and disconnect sounds.
- Cross-platform support: Windows, macOS, and Linux.
- Configurable sounds through a JSON file.
- Support for custom sound configuration files.
- Configurable Remote-SSH state polling interval.
- Reload sound configuration without restarting VS Code.
- Lightweight implementation with no runtime npm dependencies.
- Runs as a UI extension so audio playback happens locally.

## Requirements

- Visual Studio Code `1.136.0` or later.
- VS Code Remote - SSH extension for Remote-SSH functionality.

For Linux, at least one supported audio playback utility should be available:

- `paplay`
- `aplay`
- `ffplay`
- `canberra-gtk-play`

Windows and macOS use native audio playback facilities.

## Installation

### From the VS Code Marketplace

Open VS Code and search for:

**SSH Connection Sound**

The extension identifier is:

```text
omarZACK.ssh-connection-sound
```

### From a VSIX file

```bash
code --install-extension ./ssh-connection-sound-0.0.4.vsix
```

To force reinstall:

```bash
code --install-extension ./ssh-connection-sound-0.0.4.vsix --force
```

## Usage

Once installed, the extension activates automatically.

When VS Code enters a Remote-SSH session, the extension detects the connection and plays the configured **success** sound.

When the Remote-SSH session is disconnected, the extension plays the configured **disconnect** sound.

### Test the sounds

Open the Command Palette with `Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS.

Search for:

```text
SSH Connection Sound
```

Available commands:

- `SSH Connection Sound: Test Success Sound`
- `SSH Connection Sound: Test Failure Sound`
- `SSH Connection Sound: Test Disconnect Sound`
- `SSH Connection Sound: Reload Sounds`

The failure sound is currently a **manual test event**. The VS Code extension API does not provide a stable public API exposing every internal Remote-SSH connection failure, so automatic detection of all SSH failures is not guaranteed.

## Configuration

Open **Settings** and search for `SSH Connection Sound`.

### Enable or disable sounds

Setting:

```text
sshConnectionSound.enabled
```

Default:

```json
true
```

Disable all audio notifications:

```json
{
    "sshConnectionSound.enabled": false
}
```

### Custom sounds configuration

Setting:

```text
sshConnectionSound.soundsFile
```

By default, the extension uses:

```text
config/sounds.json
```

You can provide your own configuration file:

```json
{
    "sshConnectionSound.soundsFile": "/home/omar/.config/ssh-connection-sound/sounds.json"
}
```

A `~/` path is also supported:

```json
{
    "sshConnectionSound.soundsFile": "~/.config/ssh-connection-sound/sounds.json"
}
```

After changing the configuration, run:

```text
SSH Connection Sound: Reload Sounds
```

### Polling interval

Setting:

```text
sshConnectionSound.pollInterval
```

Default:

```text
500
```

The value is specified in milliseconds.

For example:

```json
{
    "sshConnectionSound.pollInterval": 250
}
```

The minimum supported value is `100 ms`.

## Sound Configuration

The bundled configuration is:

```text
config/sounds.json
```

Example:

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

### File sounds

Use:

```json
{
    "type": "file",
    "path": "/path/to/sound.wav"
}
```

For fallback files:

```json
{
    "type": "file",
    "paths": ["/path/to/primary.wav", "/path/to/fallback.wav"]
}
```

The extension checks the files in order and uses the first existing file.

### Windows system sounds

Windows supports system sounds using:

```json
{
    "type": "system",
    "sound": "Asterisk"
}
```

Examples include:

```text
Asterisk
Beep
Exclamation
Hand
Question
```

## Platform Audio Backends

### Windows

Implementation:

```text
src/audio/windows.js
```

System sounds use `System.Media.SystemSounds`.

File-based sounds use `System.Media.SoundPlayer`.

### macOS

Implementation:

```text
src/audio/macos.js
```

Audio files are played using:

```text
afplay
```

### Linux

Implementation:

```text
src/audio/linux.js
```

The extension checks for supported playback utilities in this order:

```text
paplay
aplay
ffplay
canberra-gtk-play
```

The first available player is used.

## Architecture

```text
vscode-ssh-sound/
├── assets/
│   └── icon.png
├── config/
│   └── sounds.json
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
├── test/
│   └── extension.test.js
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── CHANGELOG.md
├── LICENSE
├── package.json
└── README.md
```

### Extension entry point

```text
src/extension.js
```

Responsible for activation, configuration loading, audio initialization, command registration, Remote-SSH monitoring, and cleanup.

### Audio player

```text
src/audio/player.js
```

Provides a common interface for `success`, `failure`, and `disconnect` events and selects the appropriate platform backend.

### Configuration loader

```text
src/config/loader.js
```

Loads and validates `sounds.json`, resolves custom paths, expands `~/`, and selects the current platform configuration.

### Remote monitor

```text
src/remote/monitor.js
```

Monitors `vscode.env.remoteName` and detects transitions into and out of the Remote-SSH environment.

## Why the Extension Runs Locally

The extension declares:

```json
"extensionKind": [
  "ui"
]
```

This ensures that audio playback is performed on the local computer rather than the remote SSH server.

```text
┌──────────────────────────────┐
│       Local Computer         │
│                              │
│  VS Code                     │
│    │                         │
│    ├── SSH Connection Sound  │
│    │                         │
│    └── Local Audio Output    │
│              │               │
│              ▼               │
│       Speakers / Headphones  │
└──────────────┬───────────────┘
               │
               │ SSH
               ▼
┌──────────────────────────────┐
│        Remote Server         │
│                              │
│        SSH Session           │
└──────────────────────────────┘
```

## Development

Clone the repository:

```bash
git clone https://github.com/omarZACK/vscode-ssh-connection-sound.git
cd vscode-ssh-connection-sound
```

Install dependencies:

```bash
npm install
```

## Run in Extension Development Host

Open the project:

```bash
code .
```

Then use **Run and Debug** and select:

```text
Run SSH Connection Sound
```

This launches a VS Code Extension Development Host with the extension loaded.

## Testing

Run:

```bash
npm test
```

Current tests cover:

- Home-directory path expansion.
- Absolute path handling.
- Missing platform configuration.
- Valid Linux sound configuration.

## Syntax Checking

Run:

```bash
npm run check
```

## Package the Extension

Run:

```bash
npx vsce package
```

This generates a VSIX file such as:

```text
ssh-connection-sound-0.0.4.vsix
```

## Inspect the VSIX

Before publishing:

```bash
npx vsce ls
```

This verifies which files will be included in the package.

## Install the Local VSIX

```bash
code --install-extension ./ssh-connection-sound-0.0.4.vsix --force
```

## GitHub Actions

### Continuous Integration

```text
.github/workflows/ci.yml
```

The CI workflow runs on pushes to `main` and pull requests targeting `main`.

It performs:

1. Repository checkout.
2. Node.js setup.
3. Dependency installation.
4. `package.json` validation.
5. `sounds.json` validation.
6. JavaScript syntax checking.
7. Automated tests.
8. VSIX packaging.

### Release Automation

```text
.github/workflows/release.yml
```

The release workflow is triggered by version tags:

```text
v*
```

For example:

```bash
git tag v0.0.4
git push origin v0.0.4
```

The workflow verifies the version, runs checks and tests, builds the VSIX, creates a GitHub Release, and uploads the VSIX.

## Versioning

The project follows Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
0.0.4
```

Update `package.json` and `CHANGELOG.md` before creating a release.

For example:

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v0.0.5"
git push origin main

git tag v0.0.5
git push origin v0.0.5
```

The release workflow verifies that the Git tag and `package.json` version match.

## Publishing to the VS Code Marketplace

Install `vsce`:

```bash
npm install -g @vscode/vsce
```

Log in:

```bash
vsce login omarZACK
```

Publish:

```bash
vsce publish
```

Extension identifier:

```text
omarZACK.ssh-connection-sound
```

For automated Marketplace publishing through GitHub Actions, configure a GitHub Actions secret named:

```text
VSCE_PAT
```

Do not commit the token to the repository.

## Limitations

### Remote-SSH failure detection

The extension can detect transitions into a Remote-SSH environment through the public VS Code extension API.

However, VS Code does not expose a stable public API containing every internal Remote-SSH connection failure event.

Therefore:

- Successful Remote-SSH connections can be detected.
- Remote-SSH disconnections can be detected.
- The failure sound can be tested manually.
- Automatic detection of every possible SSH failure is not guaranteed.

## Troubleshooting

### No sound on Linux

Check for an available audio player:

```bash
which paplay
which aplay
which ffplay
which canberra-gtk-play
```

At least one should return a valid executable path.

You can test a sound manually:

```bash
paplay /usr/share/sounds/freedesktop/stereo/complete.oga
```

### Sound file does not exist

Check the configured path:

```bash
ls -l /path/to/sound.wav
```

For Linux fallback paths, the extension checks the configured `paths` entries and uses the first file that exists.

### Test manually

Use the Command Palette:

```text
SSH Connection Sound: Test Success Sound
SSH Connection Sound: Test Failure Sound
SSH Connection Sound: Test Disconnect Sound
```

### Reload configuration

After modifying `sounds.json`:

```text
SSH Connection Sound: Reload Sounds
```

### Debugging

Check:

```text
View → Output
```

and inspect the relevant extension output.

You can also use:

```text
Help → Toggle Developer Tools
```

Look for messages beginning with:

```text
[SSH Connection Sound]
```

## Security Considerations

The extension executes local audio playback commands depending on the operating system.

It does not require a remote shell command to play audio.

Custom sound paths should point only to files that you trust.

On Linux it may invoke:

```text
paplay
aplay
ffplay
canberra-gtk-play
```

On macOS:

```text
afplay
```

On Windows:

```text
powershell.exe
```

The Windows implementation validates system sound names before passing them to PowerShell.

## Project Status

Current version:

```text
0.0.4
```

Current functionality includes:

- Remote-SSH connection detection.
- Remote-SSH disconnect detection.
- Success sound.
- Disconnect sound.
- Manual failure sound testing.
- Cross-platform audio backends.
- Custom sound configuration.
- Configurable polling.
- Automated tests.
- VSIX packaging.
- GitHub Actions CI.
- Automated GitHub releases.

## Contributing

Contributions, bug reports, and feature requests are welcome.

Before submitting a change, run:

```bash
npm install
npm run check
npm test
npx vsce package
```

Ensure that all tests pass and that the generated VSIX contains only the files required by the extension.

## License

This project is licensed under the MIT License.

See `LICENSE` for the complete license text.

## Author

**Omar Wawy**

GitHub:

https://github.com/omarZACK

## Repository

https://github.com/omarZACK/vscode-ssh-connection-sound
