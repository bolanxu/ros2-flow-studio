const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (payload) => ipcRenderer.invoke('project:save', payload),
  exportLaunch: (payload) => ipcRenderer.invoke('launch:export', payload),
  rosExec: (payload) => ipcRenderer.invoke('ros:exec', payload),
  rosStartNode: (payload) => ipcRenderer.invoke('ros:startNode', payload),
  rosStopNode: (payload) => ipcRenderer.invoke('ros:stopNode', payload),
  onMenuAction: (cb) => ipcRenderer.on('menu-action', (_, action) => cb(action)),
  onRosLog: (cb) => ipcRenderer.on('ros-log', (_, payload) => cb(payload))
});
