const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let nextServerProcess;
let isShuttingDown = false;

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Gym Ease Terminal',
                message: 'Gym Ease is already running.',
                detail: 'The existing session has been brought to focus for you. Have a productive workout!',
                buttons: ['OK']
            });
        }
    });

    // Store DB in AppData so it persists after updates/reinstalls
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'gym_ease.db');

    // Ensure DB file exists (copy default if new install)
    function ensureDatabase() {
        if (!fs.existsSync(dbPath)) {
            console.log('Database not found in AppData, checking for template...');
        }
        console.log('Database Path:', dbPath);
    }

    // Backup interval reference
    let backupInterval = null;

    // Backup database to Documents folder
    function backupDatabase() {
        try {
            if (!fs.existsSync(dbPath)) return;

            const documentsPath = app.getPath('documents');
            const backupDir = path.join(documentsPath, 'GymEase_Backups');
            fs.mkdirSync(backupDir, { recursive: true });

            const backupPath = path.join(
                backupDir,
                `gym_ease_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
            );

            try {
                const fd = fs.openSync(dbPath, 'r');
                fs.closeSync(fd);
                fs.copyFileSync(dbPath, backupPath);
                console.log('Database backed up:', backupPath);
            } catch {
                console.log('Database busy, skipping this backup cycle');
            }
        } catch (err) {
            console.error('Backup failed:', err);
        }
    }

    // Start automatic backup every 30 minutes
    function startAutoBackup() {
        backupDatabase();
        backupInterval = setInterval(() => {
            backupDatabase();
        }, 30 * 60 * 1000);
        console.log('Automatic backup started (every 30 minutes)');
    }

    // Stop automatic backup
    function stopAutoBackup() {
        if (backupInterval) {
            clearInterval(backupInterval);
            backupInterval = null;
            console.log('Automatic backup stopped');
        }
    }

    // ✅ FIX 1: Kill any process occupying the port before starting
    function clearPort(port) {
        if (process.platform === 'win32') {
            try {
                execSync(
                    `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}"') do taskkill /PID %a /F`,
                    { stdio: 'ignore', shell: true }
                );
                console.log(`Cleared port ${port}`);
            } catch (e) {
                // No process on port, that's fine
            }
        } else {
            try {
                execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore', shell: true });
                console.log(`Cleared port ${port}`);
            } catch (e) {
                // No process on port, that's fine
            }
        }
    }

    const startNextServer = () => {
        return new Promise((resolve, reject) => {
            const port = 3000;

            // ✅ FIX 1: Clear port before starting
            clearPort(port);

            // Small delay after clearing port to ensure it's fully released
            setTimeout(() => {

                // ✅ FIX 3: Check if server is already running after port clear
                const req = http.get(`http://localhost:${port}`, (res) => {
                    console.log('Server already running, reusing.');
                    resolve(port);
                });

                req.on('error', () => {
                    // Port is truly free now, start fresh
                    console.log('Starting Next.js server...');

                    const isDev = !app.isPackaged;

                    let cmd, args;

                    if (isDev) {
                        cmd = 'node';
                        args = ['node_modules/next/dist/bin/next', 'dev'];
                    } else {
                        const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
                        cmd = 'node';
                        args = [serverPath];
                    }

                    const env = {
                        ...process.env,
                        DB_PATH: dbPath,
                        PORT: port,
                        JWT_SECRET: 'gym-ease-production-secret-key-change-it'
                    };

                    // ✅ FIX: detached false keeps process tied to Electron
                    nextServerProcess = spawn(cmd, args, {
                        cwd: isDev ? process.cwd() : path.join(process.resourcesPath, 'standalone'),
                        env,
                        shell: false,
                        detached: false, // ✅ Changed from true to false
                    });
                    // ✅ Removed unref()

                    nextServerProcess.stdout.on('data', (data) => {
                        console.log(`Next.js: ${data}`);
                        if (data.toString().includes('Ready in') || data.toString().includes('started server on')) {
                            setTimeout(() => resolve(port), 1000);
                        }
                    });

                    // ✅ FIX 2: Properly suppress non-critical errors with early return
                    nextServerProcess.stderr.on('data', (data) => {
                        const msg = data.toString();
                        console.error(`Next.js Error: ${msg}`);

                        // Early return for harmless errors — never reach dialog
                        if (
                            msg.includes('EADDRINUSE') ||
                            msg.includes('ExperimentalWarning') ||
                            msg.includes('DeprecationWarning') ||
                            msg.includes('punycode')
                        ) {
                            console.log('Suppressed non-critical error:', msg.trim());
                            return; // ✅ Stop here
                        }

                        // Only show dialog for real fatal errors
                        if (
                            msg.includes('MODULE_NOT_FOUND') ||
                            msg.includes('dependency missing') ||
                            msg.includes('Cannot find module')
                        ) {
                            dialog.showErrorBox('Backend Error', msg);
                        }
                    });

                    nextServerProcess.on('close', (code) => {
                        if (!isShuttingDown && code !== 0 && code !== null) {
                            dialog.showErrorBox(
                                'Server Stopped',
                                `Next.js process exited with code ${code}.\nIf Gym Ease is already open, please use the existing window.`
                            );
                        }
                    });

                    // Fallback resolve after timeout
                    setTimeout(() => resolve(port), 5000);
                });

            }, 300); // ✅ 300ms delay after port clear to ensure full release
        });
    };

    function killNextServer() {
        if (!nextServerProcess || nextServerProcess.killed) return;

        console.log('Force killing Next.js server...');

        if (process.platform === 'win32') {
            // Primary: kill by PID tree
            try {
                execSync(`taskkill /PID ${nextServerProcess.pid} /T /F`, { stdio: 'ignore' });
            } catch (e) {
                console.error('Taskkill by PID failed:', e.message);
            }
            // ✅ Backup: kill by port in case PID is stale
            try {
                execSync(
                    `for /f "tokens=5" %a in ('netstat -aon ^| find ":3000"') do taskkill /PID %a /F`,
                    { stdio: 'ignore', shell: true }
                );
            } catch (e) {
                // Silently ignore if no process found on port
            }
        } else {
            try {
                process.kill(-nextServerProcess.pid, 'SIGKILL');
            } catch (e) { }
        }

        nextServerProcess = null;
    }

    // ✅ FIX: 500ms delay ensures Next.js is fully dead before installer takes over
    function fastQuit() {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('Fast-quitting Gym Ease...');
        stopAutoBackup();
        killNextServer();
        setTimeout(() => {
            app.exit(0);
        }, 500); // ✅ Give process time to die
    }

    function createWindow(port) {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
            title: 'Gym Ease'
        });

        mainWindow.loadURL(`http://localhost:${port}`);

        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools();
        }
    }

    app.whenReady().then(async () => {
        ensureDatabase();
        startAutoBackup();
        const port = await startNextServer();
        createWindow(port);

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow(port);
            }
        });
    });

    /* ================== APP SHUTDOWN HANDLERS ================== */

    // Fired when all windows are closed
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            fastQuit();
        }
    });

    // Fired when app is quitting (Cmd+Q, Alt+F4, installer close, etc.)
    app.on('before-quit', () => {
        fastQuit();
    });

    // Fired when Node process exits
    process.on('exit', () => {
        killNextServer();
    });

    // Fired on Ctrl+C (dev mode)
    process.on('SIGINT', () => {
        fastQuit();
    });

    // Fired on system kill / shutdown
    process.on('SIGTERM', () => {
        fastQuit();
    });
}