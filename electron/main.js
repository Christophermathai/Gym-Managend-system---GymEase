const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const { autoUpdater } = require('electron-updater');

// Configure autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = console;

autoUpdater.on('checking-for-update', () => {
    console.log('[Auto-Updater] Checking for update...');
});
autoUpdater.on('update-available', (info) => {
    console.log('[Auto-Updater] Update available:', info.version);
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Gym Ease Update Available',
            message: `A new version of Gym Ease (${info.version}) is available.`,
            detail: 'Would you like to download and install it now?',
            buttons: ['Download Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                console.log('[Auto-Updater] User approved download. Starting download...');
                autoUpdater.downloadUpdate();
            }
        });
    }
});
autoUpdater.on('update-not-available', (info) => {
    console.log('[Auto-Updater] Update not available.');
});
autoUpdater.on('error', (err) => {
    console.error('[Auto-Updater] Error:', err);
});
autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[Auto-Updater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
});
autoUpdater.on('update-downloaded', (info) => {
    console.log('[Auto-Updater] Update downloaded; prompting user to restart.');
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Gym Ease Update Ready',
            message: 'A new version of Gym Ease has been downloaded.',
            detail: 'Restart the application now to apply the update and enjoy the latest features!',
            buttons: ['Restart Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    }
});

let mainWindow;
let nextServerProcess;
let isShuttingDown = false;

// ✅ Override app name in dev so AppData path is correct
if (!app.isPackaged) {
    app.setName('gym-ease-nextjs');
}

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

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'gym_ease.db');

    // ✅ Root of the Next.js project (one level up from electron/ folder)
    const projectRoot = path.join(__dirname, '..');

    function ensureDatabase() {
        if (!fs.existsSync(dbPath)) {
            console.log('Database not found in AppData, checking for template...');
        }
        console.log('Database Path:', dbPath);
    }

    let backupInterval = null;

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

                // Rotation logic: Keep latest 5
                const files = fs.readdirSync(backupDir)
                    .filter(f => f.startsWith('gym_ease_backup_') && f.endsWith('.db'))
                    .map(f => ({
                        name: f,
                        time: fs.statSync(path.join(backupDir, f)).mtimeMs
                    }))
                    .sort((a, b) => b.time - a.time); // newest first

                const toDelete = allBackups.slice(5); // keep top 5, delete rest
                for (const file of toDelete) {
                    fs.unlinkSync(path.join(backupDir, file.name));
                    console.log('Deleted old backup:', file.name);
                }
            } catch (cleanupErr) {
                console.error('Backup cleanup failed:', cleanupErr.message);
            }

        } catch (err) {
            console.error('Backup failed:', err);
        }
    }

    function startAutoBackup() {
        backupDatabase();
        backupInterval = setInterval(backupDatabase, 30 * 60 * 1000);
        console.log('Automatic backup started (every 30 minutes)');
    }

    function stopAutoBackup() {
        if (backupInterval) {
            clearInterval(backupInterval);
            backupInterval = null;
            console.log('Automatic backup stopped');
        }
    }

    function clearPort(port) {
        if (process.platform === 'win32') {
            try {
                execSync(
                    `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}"') do taskkill /PID %a /F`,
                    { stdio: 'ignore', shell: true }
                );
                console.log(`Cleared port ${port}`);
            } catch (e) { }
        } else {
            try {
                execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore', shell: true });
            } catch (e) { }
        }
    }

    const startNextServer = () => {
        return new Promise((resolve, reject) => {
            const port = 3000;

            clearPort(port);

            setTimeout(() => {

                // Check if server already running
                const req = http.get(`http://localhost:${port}`, (res) => {
                    console.log('Server already running, reusing.');
                    resolve(port);
                });

                req.on('error', () => {
                    console.log('Starting Next.js server...');

                    const isDev = !app.isPackaged;
                    let cmd, args, cwd;

                    if (isDev) {
                        cmd = 'node';
                        args = [
                            path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
                            'dev'
                        ];
                        cwd = projectRoot;
                    } else {
                        const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
                        // Use Electron's own node runtime in packaged mode
                        cmd = process.execPath;
                        args = [serverPath];
                        cwd = path.join(process.resourcesPath, 'standalone');
                    }

                    // Generate or load JWT secret
                    let jwtSecret;
                    const secretPath = path.join(userDataPath, 'secret.key');
                    // Ensure userData directory exists
                    if (!fs.existsSync(userDataPath)) {
                        fs.mkdirSync(userDataPath, { recursive: true });
                    }

                    if (fs.existsSync(secretPath)) {
                        jwtSecret = fs.readFileSync(secretPath, 'utf8');
                        console.log('Using stored JWT_SECRET');
                    } else {
                        jwtSecret = require('crypto').randomBytes(32).toString('hex');
                        fs.writeFileSync(secretPath, jwtSecret, 'utf8');
                        console.log('Generated new JWT_SECRET');
                    }

                    const env = {
                        ...process.env,
                        DB_PATH: dbPath,
                        PORT: port,
                        HOSTNAME: '127.0.0.1',
                        ELECTRON_RUN_AS_NODE: '1', // Critical for using process.execPath as node
                        JWT_SECRET: jwtSecret
                    };

                    nextServerProcess = spawn(cmd, args, {
                        cwd,
                        env,
                        shell: false,
                        detached: false,
                    });

                    // ✅ FIX: Guard flag so resolve is only called ONCE
                    let resolved = false;

                    nextServerProcess.stdout.on('data', (data) => {
                        const msg = data.toString();
                        console.log(`Next.js: ${msg}`);

                        // ✅ Resolve on Ready signal — only once
                        if (!resolved && (msg.includes('Ready in') || msg.includes('started server on'))) {
                            resolved = true;
                            console.log('Next.js server is ready!');
                            setTimeout(() => resolve(port), 500); // small buffer after ready
                        }
                    });

                    nextServerProcess.stderr.on('data', (data) => {
                        const msg = data.toString();
                        console.error(`Next.js Error: ${msg}`);

                        // Suppress non-critical errors
                        if (
                            msg.includes('EADDRINUSE') ||
                            msg.includes('ExperimentalWarning') ||
                            msg.includes('DeprecationWarning') ||
                            msg.includes('punycode')
                        ) {
                            console.log('Suppressed non-critical error:', msg.trim());
                            return;
                        }

                        if (
                            msg.includes('MODULE_NOT_FOUND') ||
                            msg.includes('dependency missing') ||
                            msg.includes('Cannot find module') ||
                            msg.includes('FAILED TO LOAD better-sqlite3') ||
                            msg.includes('Database dependency missing') ||
                            msg.includes('JWT_SECRET environment variable is missing')
                        ) {
                            dialog.showErrorBox('Backend Error', msg);
                        }
                    });

                    nextServerProcess.on('close', (code) => {
                        if (!isShuttingDown && code !== 0 && code !== null) {
                            dialog.showErrorBox(
                                'Server Stopped',
                                `Next.js process exited with code ${code}.`
                            );
                        }
                    });

                    // ✅ Fallback: if stdout never fires Ready, resolve after 15s
                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            console.log('Fallback resolve after 15s timeout');
                            resolve(port);
                        }
                    }, 15000);
                });

            }, 300);
        });
    };

    function killNextServer() {
        if (!nextServerProcess || nextServerProcess.killed) return;

        console.log('Force killing Next.js server...');

        if (process.platform === 'win32') {
            try {
                execSync(`taskkill /PID ${nextServerProcess.pid} /T /F`, { stdio: 'ignore' });
            } catch (e) {
                console.error('Taskkill by PID failed:', e.message);
            }
            try {
                execSync(
                    `for /f "tokens=5" %a in ('netstat -aon ^| find ":3000"') do taskkill /PID %a /F`,
                    { stdio: 'ignore', shell: true }
                );
            } catch (e) { }
        } else {
            try {
                process.kill(-nextServerProcess.pid, 'SIGKILL');
            } catch (e) { }
        }

        nextServerProcess = null;
    }

    function fastQuit() {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('Fast-quitting Gym Ease...');
        stopAutoBackup();
        killNextServer();
        setTimeout(() => {
            app.exit(0);
        }, 500);
    }

    app.whenReady().then(async () => {
        ensureDatabase();
        startAutoBackup();

        // Check for updates on startup if packaged
        if (app.isPackaged) {
            autoUpdater.checkForUpdatesAndNotify().catch((err) => {
                console.error('[Auto-Updater] Failed to check for updates:', err);
            });
        }

        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            show: true,
            backgroundColor: '#171717',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
            title: 'Gym Ease'
        });

        // ✅ Splash screen shown instantly
        mainWindow.loadURL(
            'data:text/html,<!DOCTYPE html><html><head><style>*{margin:0;padding:0}body{background:%23171717;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;font-family:Segoe UI,sans-serif;color:white}.logo{font-size:2.2rem;font-weight:700;letter-spacing:8px}.sub{font-size:0.7rem;letter-spacing:4px;color:%23555}.bar{width:120px;height:2px;background:%23222;border-radius:2px;overflow:hidden}.fill{height:100%;background:white;animation:l 8s ease-in-out forwards}@keyframes l{0%{width:0%}50%{width:70%}90%{width:92%}100%{width:100%}}</style></head><body><div class=logo>GYM EASE</div><div class=sub>LOADING YOUR WORKSPACE</div><div class=bar><div class=fill></div></div></body></html>'
        );

        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools();
        }

        // ✅ Start server — load real app once ready signal fires
        try {
            const port = await startNextServer();
            console.log(`Loading app on port ${port}`);
            mainWindow.loadURL(`http://localhost:${port}`);
        } catch (err) {
            console.error('Failed to start server:', err.message);
            dialog.showErrorBox('Startup Failed', 'Could not start the Gym Ease server. Please restart the app.');
            fastQuit();
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                mainWindow.loadURL(`http://localhost:3000`);
            }
        });
    });

    /* ================== APP SHUTDOWN HANDLERS ================== */

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            fastQuit();
        }
    });

    app.on('before-quit', () => {
        fastQuit();
    });

    process.on('exit', () => {
        killNextServer();
    });

    process.on('SIGINT', () => {
        fastQuit();
    });

    process.on('SIGTERM', () => {
        fastQuit();
    });
}