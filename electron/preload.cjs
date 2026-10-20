const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pixy', {
  load: () => ipcRenderer.invoke('pixy:load'),
  save: (data) => ipcRenderer.invoke('pixy:save', data),
  saveSync: (data) => ipcRenderer.sendSync('pixy:save-sync', data),
});
