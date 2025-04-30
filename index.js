const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { migratePaths } = require('./migration');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true // ← Включаем DevTools
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools(); // ← Включаем DevTools при старте

    mainWindow.on('closed', () => mainWindow = null);
}

// Обработчик выбора пути
ipcMain.handle('select-path', async (event, mode) => {
    try {
        const properties = mode === 'file'
            ? ['openFile', 'multiSelections']
            : ['openDirectory'];

        const { filePaths } = await dialog.showOpenDialog({
            properties: [...properties, 'createDirectory'],
            filters: [
                { name: 'Поддерживаемые файлы', extensions: ['svelte', 'html', 'js'] },
                { name: 'Все файлы', extensions: ['*'] }
            ]
        });

        return filePaths || [];
    } catch (error) {
        console.error('Ошибка выбора пути:', error);
        return [];
    }
});

// Обработчик миграции
ipcMain.on('start-migration', async (event, paths) => {
    try {
        await migratePaths(paths, (message) => {
            mainWindow.webContents.send('migration-log', message);
        });
    } catch (error) {
        mainWindow.webContents.send('migration-error', error.message);
    }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
