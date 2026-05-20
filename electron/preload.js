const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.send('check-for-updates')
});
