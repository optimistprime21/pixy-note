const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Veriler ~/.config/pixy-note/ altında tek bir JSON dosyasında tutulur.
// Yolu sabitliyoruz; yoksa geliştirme ve paketlenmiş sürüm farklı klasörlere yazar.
app.setPath('userData', path.join(app.getPath('appData'), 'pixy-note'));

const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'pixy-data.json');
const backupFile = () => path.join(dataDir(), 'pixy-data.backup.json');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// Önce geçici dosyaya yazıp sonra yeniden adlandırıyoruz; yazma yarıda kalırsa veri bozulmaz.
function writeAtomic(data) {
  fs.mkdirSync(dataDir(), { recursive: true });
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, dataFile());
}

ipcMain.handle('pixy:load', () => readJson(dataFile()) ?? readJson(backupFile()));
ipcMain.handle('pixy:save', (_e, data) => {
  writeAtomic(data);
  return true;
});
ipcMain.on('pixy:save-sync', (e, data) => {
  try {
    writeAtomic(data);
    e.returnValue = true;
  } catch (err) {
    console.error(err);
    e.returnValue = false;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 960,
    minHeight: 620,
    title: 'Pixy Note',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#6b3d1f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// İki kopya aynı veri dosyasına yazıp birbirinin değişikliğini ezmesin:
// uygulama zaten açıksa (ör. dock'tan tekrar tıklandıysa) mevcut pencereyi öne getir.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  app.whenReady().then(() => {
    // Açılışta sağlam veriyi yedekle (bozuk dosyayı yedeğin üstüne yazma).
    if (readJson(dataFile())) fs.copyFileSync(dataFile(), backupFile());
    createWindow();
  });
}

app.on('window-all-closed', () => app.quit());
