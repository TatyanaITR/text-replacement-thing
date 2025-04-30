const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectPath: (mode) => ipcRenderer.invoke('select-path', mode),
    startMigration: (paths) => ipcRenderer.send('start-migration', paths),
    onMigrationLog: (callback) => ipcRenderer.on('migration-log', callback),
    onMigrationError: (callback) => ipcRenderer.on('migration-error', callback)
});
