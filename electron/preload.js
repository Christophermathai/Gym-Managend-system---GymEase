const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
    removeUpdateStatusListener: () => ipcRenderer.removeAllListeners('update-status')
});
