import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// 🔹 Объявляем переменную icon явно
const icon = join(__dirname, '../../resources/icon.ico');

// Подключение к БД и обработчики запросов
import connectDB from './db';
import { getPartners, createPartner, updatePartner } from './dbHandlers';

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon, // Используем объявленную переменную
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}), // Можно оставить для полноты
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  global.dbclient = await connectDB();

  ipcMain.handle('getPartners', async () => {
    try {
      return await getPartners();
    } catch (e) {
      dialog.showErrorBox('Ошибка', e.message);
      return [];
    }
  });

  ipcMain.handle('createPartner', async (event, partner) => {
    try {
      await createPartner(partner);
      dialog.showMessageBox({ message: 'Успех! Партнер создан' });
      return true;
    } catch (e) {
      dialog.showErrorBox('Ошибка', e.message);
      return false;
    }
  });

  ipcMain.handle('updatePartner', async (event, partner) => {
    try {
      await updatePartner(partner);
      dialog.showMessageBox({ message: 'Успех! Данные обновлены' });
      return true;
    } catch (e) {
      dialog.showErrorBox('Ошибка', e.message);
      return false;
    }
  });

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // ✅ Закрываем соединение с БД при выходе
  app.on('will-quit', async () => {
    if (global.dbclient) {
      await global.dbclient.end();
      console.log('Соединение с базой данных закрыто.');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});