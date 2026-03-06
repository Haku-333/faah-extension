const vscode = require('vscode');
const { spawn } = require('child_process');
const player = require('play-sound')();
const path = require('path');
const fs = require('fs');

const PLAY_COOLDOWN_MS = 1500;
let lastPlayAt = 0;
let cachedSoundPath;
const diagnosticErrorCounts = new Map();

function activate(context) {

    console.log('Fail sound extension active');

    const disposable = vscode.commands.registerCommand('test-fail-sound.runTests', () => {
        runTests(context);
    });
    const testSoundCommand = vscode.commands.registerCommand('test-fail-sound.playFailSound', () => {
        playFailSound(context);
    });

    const taskFailureListener = vscode.tasks.onDidEndTaskProcess((event) => {
        if (typeof event.exitCode === 'number' && event.exitCode !== 0) {
            playFailSound(context);
        }
    });

    const debugFailureListener = vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
        if (event.event !== 'terminated') {
            return;
        }

        const exitCode = event.body && event.body.exitCode;
        if (typeof exitCode === 'number' && exitCode !== 0) {
            playFailSound(context);
        }
    });

    const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((event) => {
        let shouldPlay = false;

        for (const uri of event.uris) {
            const key = uri.toString();
            const previousCount = diagnosticErrorCounts.get(key) || 0;
            const currentCount = vscode.languages
                .getDiagnostics(uri)
                .filter((diagnostic) => diagnostic.severity === vscode.DiagnosticSeverity.Error)
                .length;

            diagnosticErrorCounts.set(key, currentCount);

            if (previousCount === 0 && currentCount > 0) {
                shouldPlay = true;
            }
        }

        if (shouldPlay) {
            playFailSound(context);
        }
    });

    const terminalCommandFailureListener = vscode.window.onDidEndTerminalShellExecution((event) => {
        if (typeof event.exitCode === 'number' && event.exitCode !== 0) {
            playFailSound(context);
        }
    });

    context.subscriptions.push(
        disposable,
        testSoundCommand,
        taskFailureListener,
        debugFailureListener,
        diagnosticsListener,
        terminalCommandFailureListener
    );
}

function runTests(context) {
    const output = vscode.window.createOutputChannel('Test Runner');
    output.show();

    const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Open a project folder before running tests.');
        return;
    }

    const proc = spawn('npm', ['test'], {
        shell: true,
        cwd: workspaceFolder.uri.fsPath,
    });

    proc.stdout.on('data', data => {
        const text = data.toString();
        output.append(text);

        if (text.toLowerCase().includes('fail')) {
            playFailSound(context);
        }
    });

    proc.stderr.on('data', data => {
        output.append(data.toString());
    });

    proc.on('error', (err) => {
        output.appendLine(`Failed to run tests: ${err.message}`);
    });
}

function playFailSound(context) {
    const now = Date.now();
    if (now - lastPlayAt < PLAY_COOLDOWN_MS) {
        return;
    }

    const soundPath = getSoundPath(context);
    if (!soundPath) {
        return;
    }

    lastPlayAt = now;
    if (process.platform === 'win32') {
        playWithPowerShell(soundPath);
        return;
    }

    player.play(soundPath, (err) => err && console.log(err));
}

function playWithPowerShell(soundPath) {
    const escapedPath = soundPath.replace(/'/g, "''");
    const command = [
        'Add-Type -AssemblyName presentationCore;',
        `$p = New-Object System.Windows.Media.MediaPlayer;`,
        `$p.Open([Uri]'${escapedPath}');`,
        '$p.Play();',
        'Start-Sleep -Milliseconds 1800;',
    ].join(' ');

    const ps = spawn('powershell', ['-NoProfile', '-Command', command], {
        windowsHide: true,
        stdio: 'ignore',
    });

    ps.on('error', (err) => console.log(err));
}

function getSoundPath(context) {
    if (cachedSoundPath) {
        return cachedSoundPath;
    }

    const mediaDir = path.join(context.extensionPath, 'media');
    const preferredFiles = ['faaah.mp3', 'Fahhhh - Sound effect (HD).mp3'];

    for (const filename of preferredFiles) {
        const candidate = path.join(mediaDir, filename);
        if (fs.existsSync(candidate)) {
            cachedSoundPath = candidate;
            return cachedSoundPath;
        }
    }

    try {
        const firstMp3 = fs.readdirSync(mediaDir).find((name) => name.toLowerCase().endsWith('.mp3'));
        if (firstMp3) {
            cachedSoundPath = path.join(mediaDir, firstMp3);
            return cachedSoundPath;
        }
    } catch (err) {
        console.log(err);
    }

    console.log('No mp3 file found in media directory for fail sound.');
    return null;
}

function deactivate() {}

module.exports = { activate, deactivate };
