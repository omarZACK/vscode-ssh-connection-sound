# SSH Connection Sound

A lightweight VS Code extension for playing local desktop sounds when a
Remote-SSH connection succeeds or disconnects.

## Default sounds

- Success: `/usr/share/sounds/freedesktop/stereo/complete.oga`
- Failure: `/usr/share/sounds/freedesktop/stereo/dialog-error.oga`
- Disconnect: `/usr/share/sounds/freedesktop/stereo/service-logout.oga`

## Installation

```bash
npm install -g @vscode/vsce
cd ~/vscode-ssh-sound
vsce package
code --install-extension ssh-connection-sound-0.0.2.vsix
```

Reload VS Code after installation.

## Important

The sounds are played on the local machine running VS Code, not on the SSH
server.

Failure detection depends on messages exposed by VS Code/Remote-SSH. The
Remote-SSH API does not provide a general public `connectionFailed` event, so
failure detection cannot be guaranteed for every possible failure mode.

## License

MIT
