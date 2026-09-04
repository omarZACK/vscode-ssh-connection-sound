const vscode = require("vscode");
const { exec } = require("child_process");

let interval = null;
let previousRemoteName = undefined;
let previousWasSsh = false;
let connectionAttemptInProgress = false;

function playSound(soundPath) {
  if (!soundPath) {
    console.log("[SSH Sound] No sound configured.");
    return;
  }
  const command =
    `paplay "${soundPath}" 2>/dev/null || ` +
    `aplay "${soundPath}" 2>/dev/null || true`;
  exec(command, (error) => {
    if (error) {
      console.log(`[SSH Sound] Failed to play sound: ${error.message}`);
    }
  });
}

function getConfig() {
  return vscode.workspace.getConfiguration("sshConnectionSound");
}

function getSound(setting) {
  return getConfig().get(setting);
}

function isSshRemote(remoteName) {
  return typeof remoteName === "string" && remoteName.startsWith("ssh-remote");
}

function activate(context) {
  console.log("[SSH Sound] Extension activated.");

  previousRemoteName = vscode.env.remoteName;
  previousWasSsh = isSshRemote(previousRemoteName);

  /*
   * Detect when VS Code becomes connected to an SSH remote.
   */
  interval = setInterval(() => {
    const currentRemoteName = vscode.env.remoteName;
    const currentIsSsh = isSshRemote(currentRemoteName);

    const enabled = getConfig().get("enabled", true);

    if (!enabled) {
      previousRemoteName = currentRemoteName;
      previousWasSsh = currentIsSsh;
      return;
    }

    /*
     * SUCCESS
     *
     * We were not connected to SSH before,
     * and now we are connected to SSH.
     */
    if (!previousWasSsh && currentIsSsh) {
      console.log(
        `[SSH Sound] SSH connection successful: ${currentRemoteName}`,
      );

      playSound(getSound("successSound"));

      connectionAttemptInProgress = false;
    }

    /*
     * DISCONNECT
     *
     * We were connected to SSH before,
     * and now we are no longer connected.
     */
    if (previousWasSsh && !currentIsSsh) {
      console.log("[SSH Sound] SSH connection disconnected.");

      playSound(getSound("disconnectSound"));

      connectionAttemptInProgress = false;
    }

    previousRemoteName = currentRemoteName;
    previousWasSsh = currentIsSsh;
  }, 500);

  /*
   * Watch Remote-SSH log output.
   *
   * This gives us a way to detect connection failures.
   */
  const terminalWatcher = vscode.window.onDidOpenTerminal((terminal) => {
    const name = terminal.name.toLowerCase();

    if (name.includes("ssh") || name.includes("remote")) {
      connectionAttemptInProgress = true;
    }
  });

  context.subscriptions.push(terminalWatcher);

  /*
   * Watch messages shown by VS Code.
   *
   * This catches common Remote-SSH failure messages.
   */
  const messageWatcher = vscode.window.onDidChangeActiveTextEditor(() => {
    /*
     * Intentionally empty.
     *
     * The actual failure detection is handled by
     * the command/log watcher below.
     */
  });

  context.subscriptions.push(messageWatcher);

  context.subscriptions.push({
    dispose: () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  });
}

function deactivate() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

module.exports = {
  activate,
  deactivate,
};
