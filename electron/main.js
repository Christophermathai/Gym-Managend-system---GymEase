const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let nextServerProcess;

// Store DB in AppData so it persists after updates/reinstalls
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'gym_ease.db');

// Ensure DB file exists (copy default if new install)
function ensureDatabase() {
    if (!fs.existsSync(dbPath)) {
        console.log('Database not found in AppData, checking for template...');
        // In production, you might bundle a template.db
        // For now, Next.js init logic will create it empty if it doesn't exist
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
    // Initial backup
    backupDatabase();

    // Set interval for 30 minutes (30 * 60 * 1000 ms)
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

const startNextServer = () => {
    return new Promise((resolve, reject) => {
        // We launch next dev for simple wrapper or node server.js for prod
        // Getting a free port is better but let's stick to 3000 for simplicity first or find a free one
        const port = 3000;

        // In production (bundled), we need to run the built next app
        // In dev, we can rely on manual start or spawn it.

        // Check if server is already running
        const req = http.get(`http://localhost:${port}`, (res) => {
            resolve(port);
        });

        req.on('error', (err) => {
            // Server not running, let's spawn it
            console.log('Starting Next.js server...');

            const isDev = !app.isPackaged;

            let cmd, args;

            if (isDev) {
                cmd = 'node';
                args = ['node_modules/next/dist/bin/next', 'dev'];
            } else {
                // Production: run standalone server
                // This expects the .next/standalone folder to be copied into resources
                const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
                cmd = 'node';
                args = [serverPath];
            }

            // Pass the DB_PATH and JWT_SECRET to the Next.js process
            const env = {
                ...process.env,
                DB_PATH: dbPath,
                PORT: port,
                JWT_SECRET: 'gym-ease-production-secret-key-change-it'
            };

            nextServerProcess = spawn(cmd, args, {
                cwd: isDev ? process.cwd() : path.join(process.resourcesPath, 'standalone'),
                env,
                shell: false,
                detached: true
            });
            nextServerProcess.unref();
            nextServerProcess.stdout.on('data', (data) => {
                console.log(`Next.js: ${data}`);
                if (data.toString().includes('Ready in') || data.toString().includes('started server on')) {
                    setTimeout(() => resolve(port), 1000); // Give it a sec
                }
            });

            nextServerProcess.stderr.on('data', (data) => {
                console.error(`Next.js Error: ${data}`);
                const msg = data.toString();
                if (msg.includes('Error:') || msg.includes('MODULE_NOT_FOUND') || msg.includes('dependency missing')) {
                    dialog.showErrorBox('Backend Error', msg);
                }
            });

            nextServerProcess.on('close', (code) => {
                if (code !== 0 && code !== null) {
                    dialog.showErrorBox('Server Crashed', `Next.js process exited with code ${code}.\nPlease check the 'Backend Error' dialog for details.`);
                }
            });

            // Fallback resolve after timeout if stdout detection is flaky
            setTimeout(() => resolve(port), 5000);
        });
    });
};

function killNextServer() {
    if (!nextServerProcess || nextServerProcess.killed) return;

    console.log('Force killing Next.js server...');

    if (process.platform === 'win32') {
        // Kill entire process tree reliably
        execSync(`taskkill /PID ${nextServerProcess.pid} /T /F`, { stdio: 'ignore' });
    } else {
        // Kill process group
        try {
            process.kill(-nextServerProcess.pid, 'SIGKILL');
        } catch (e) { }
    }

    nextServerProcess = null;
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
    startAutoBackup(); // Start automatic backup
    const port = await startNextServer();
    createWindow(port);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow(port);
        }
    });
});

// app.on('window-all-closed', () => {
//     // Kill the server process immediately when window closes
//     if (nextServerProcess) {
//         console.log('Killing Next.js server process...');

//         // On Windows, use taskkill for more reliable termination
//         if (process.platform === 'win32') {
//             exec(`taskkill /pid ${nextServerProcess.pid} /T /F`, (error) => {
//                 if (error) {
//                     console.error('Error killing process:', error);
//                 } else {
//                     console.log('Server process killed successfully');
//                 }
//             });
//         } else {
//             // Unix-like systems
//             nextServerProcess.kill('SIGTERM');
//             setTimeout(() => {
//                 if (nextServerProcess && !nextServerProcess.killed) {
//                     nextServerProcess.kill('SIGKILL');
//                 }
//             }, 2000);
//         }

//         nextServerProcess = null;
//     }

//     if (process.platform !== 'darwin') {
//         app.quit();
//     }
// });

// Additional cleanup on app quit
// app.on('before-quit', () => {
//     if (nextServerProcess) {
//         console.log('App quitting - killing server...');

//         if (process.platform === 'win32') {
//             exec(`taskkill /pid ${nextServerProcess.pid} /T /F`);
//         } else {
//             nextServerProcess.kill('SIGKILL');
//         }

//         nextServerProcess = null;
//     }
// });


/* ================== APP SHUTDOWN HANDLERS ================== */

// Fired when all windows are closed
app.on('window-all-closed', () => {
    killNextServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Fired when app is quitting (Cmd+Q, Alt+F4, installer close, etc.)
app.on('before-quit', () => {
    stopAutoBackup();
    killNextServer();
});

// Fired when Node process exits
process.on('exit', () => {
    killNextServer();
});

// Fired on Ctrl+C (dev mode)
process.on('SIGINT', () => {
    killNextServer();
});

// Fired on system kill / shutdown
process.on('SIGTERM', () => {
    killNextServer();
});
