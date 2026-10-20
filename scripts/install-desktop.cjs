// Pixy Note'u uygulama menüsüne ekler (~/.local/share/applications/pixy-note.desktop).
// Simge derlenmiş sürümü (dist/) açar; kod değiştikten sonra `npm run build` yeterli.
// Kullanım: npm run desktop            -> menüye ekle
//           npm run desktop -- --pin   -> ayrıca dock'a sabitle
//           npm run desktop -- --remove -> menüden ve dock'tan kaldır
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP_ID = 'pixy-note.desktop';
const appsDir = path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'applications');
const desktopFile = path.join(appsDir, APP_ID);
const args = process.argv.slice(2);

function run(cmd, cmdArgs) {
  try {
    return execFileSync(cmd, cmdArgs, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// GNOME dock'undaki sabit uygulamalar: "['a.desktop', 'b.desktop']"
function getFavorites() {
  const out = run('gsettings', ['get', 'org.gnome.shell', 'favorite-apps']);
  if (!out) return null;
  return [...out.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function setFavorites(list) {
  run('gsettings', ['set', 'org.gnome.shell', 'favorite-apps', `[${list.map((a) => `'${a}'`).join(', ')}]`]);
}

if (args.includes('--remove')) {
  fs.rmSync(desktopFile, { force: true });
  const favs = getFavorites();
  if (favs?.includes(APP_ID)) setFavorites(favs.filter((a) => a !== APP_ID));
  run('update-desktop-database', [appsDir]);
  console.log('Pixy Note menüden ve dock’tan kaldırıldı.');
  process.exit(0);
}

const electronBin = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron');
if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('Önce derleme gerekli: npm run build');
  process.exit(1);
}
if (!fs.existsSync(path.join(ROOT, 'electron', 'icon.png'))) {
  require('./make-icon.cjs');
}

// Exec satırındaki boşluklu yollar tırnak içinde olmalı
const q = (p) => (/\s/.test(p) ? `"${p}"` : p);

const entry = `[Desktop Entry]
Type=Application
Name=Pixy Note
GenericName=Not Defteri
Comment=Stardew esintili not ve akış (workflow) uygulaması
Exec=env -u ELECTRON_RUN_AS_NODE ${q(electronBin)} ${q(ROOT)}
Icon=${path.join(ROOT, 'electron', 'icon.png')}
Terminal=false
Categories=Office;
Keywords=not;note;workflow;akış;stardew;
StartupNotify=true
StartupWMClass=pixy-note
`;

fs.mkdirSync(appsDir, { recursive: true });
fs.writeFileSync(desktopFile, entry, { mode: 0o755 });
run('update-desktop-database', [appsDir]);
console.log('Menüye eklendi:', desktopFile);

if (args.includes('--pin')) {
  const favs = getFavorites();
  if (!favs) {
    console.log('gsettings bulunamadı; dock’a elle sabitle (simgeye sağ tık → Sık Kullanılanlara Ekle).');
  } else if (favs.includes(APP_ID)) {
    console.log('Zaten dock’ta sabitli.');
  } else {
    setFavorites([...favs, APP_ID]);
    console.log('Dock’a sabitlendi.');
  }
}
