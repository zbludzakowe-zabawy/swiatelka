// Wersja na komputer (Electron). Gra wczytywana jest z plików dołączonych do aplikacji
// przez własny protokół app:// — nie potrzeba internetu ani serwera.
const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const SCHEME = 'app';
const HOST = 'swiatelka';
const START_URL = `${SCHEME}://${HOST}/index.html`;

// Gra nie potrzebuje sieci — wyłącz też automatyczne pobieranie komponentów Chromium.
app.commandLine.appendSwitch('disable-component-update');

// Moduły ES wymagają „prawdziwego” pochodzenia (origin) — file:// go nie ma.
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Zamienia adres app://swiatelka/... na ścieżkę pliku wewnątrz aplikacji (albo null).
function resolveFile(url) {
  const { host, pathname } = new URL(url);
  if (host !== HOST) return null;
  const file = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
  return file.startsWith(ROOT + path.sep) ? file : null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 860,
    minWidth: 360,
    minHeight: 560,
    backgroundColor: '#12151a',
    title: 'Gra w światełka',
    icon: path.join(ROOT, 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  win.once('ready-to-show', () => win.show());

  // Linki zewnętrzne (gdyby się pojawiły) otwieramy w przeglądarce, nie w oknie gry.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}/`)) e.preventDefault();
  });

  win.loadURL(START_URL);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    protocol.handle(SCHEME, request => {
      const file = resolveFile(request.url);
      if (!file) return new Response('Nie znaleziono', { status: 404 });
      return net.fetch(pathToFileURL(file).toString());
    });

    // Na macOS zostawiamy standardowe menu (Cmd+Q itd.), gdzie indziej menu nie jest potrzebne.
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);

    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

