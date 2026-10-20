// VS Code terminali ELECTRON_RUN_AS_NODE=1 ayarlıyor; o durumda Electron düz Node gibi
// davranıp pencere açmaz. Bu küçük başlatıcı değişkeni temizleyip Electron'u çalıştırır.
const { spawn } = require('node:child_process');
const electron = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, ['.', ...process.argv.slice(2)], { stdio: 'inherit', env });
child.on('exit', (code) => process.exit(code ?? 0));
