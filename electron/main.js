const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const {
  loadProjectDocument,
  createProjectDocumentFromGraph
} = require('./core/project-store');

let mainWindow = null;
const running = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', click: () => mainWindow.webContents.send('menu-action', 'new') },
        { label: 'Open...', click: () => mainWindow.webContents.send('menu-action', 'open') },
        { label: 'Save', click: () => mainWindow.webContents.send('menu-action', 'save') },
        { label: 'Save As...', click: () => mainWindow.webContents.send('menu-action', 'saveAs') },
        { type: 'separator' },
        { label: 'Export launch.py', click: () => mainWindow.webContents.send('menu-action', 'exportLaunch') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [{ label: 'ROS2 Flow Studio' }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendRosLog(payload) {
  if (!mainWindow) return;
  mainWindow.webContents.send('ros-log', payload);
}

ipcMain.handle('project:open', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open .ros2flow',
    filters: [{ name: 'ROS2 Flow Project', extensions: ['ros2flow', 'json'] }],
    properties: ['openFile']
  });
  if (res.canceled || !res.filePaths.length) return null;
  const filePath = res.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    const raw = JSON.parse(content);
    const doc = loadProjectDocument(raw);
    return { filePath, data: doc };
  } catch (error) {
    await dialog.showErrorBox('Failed to open project', String(error.message || error));
    return null;
  }
});

ipcMain.handle('project:save', async (event, { data, filePath }) => {
  let target = filePath;
  if (!target) {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Save .ros2flow',
      defaultPath: 'project.ros2flow',
      filters: [{ name: 'ROS2 Flow Project', extensions: ['ros2flow', 'json'] }]
    });
    if (res.canceled || !res.filePath) return null;
    target = res.filePath;
  }
  const doc = createProjectDocumentFromGraph(data || {});
  fs.writeFileSync(target, JSON.stringify(doc, null, 2), 'utf-8');
  return { filePath: target };
});

ipcMain.handle('launch:export', async (event, { content }) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Export launch.py',
    defaultPath: 'generated.launch.py',
    filters: [{ name: 'Python', extensions: ['py'] }]
  });
  if (res.canceled || !res.filePath) return null;
  fs.writeFileSync(res.filePath, content, 'utf-8');
  return { filePath: res.filePath };
});

ipcMain.handle('ros:exec', async (event, { command, args = [], cwd, env }) => {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, env, shell: false });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ code, stdout, stderr }));
  });
});

ipcMain.handle('ros:startNode', async (event, { id, command, args = [], cwd, env }) => {
  if (running.has(id)) return { ok: false, reason: 'already_running' };
  const proc = spawn(command, args, { cwd, env, shell: false });
  running.set(id, proc);
  proc.stdout.on('data', (d) => sendRosLog({ id, level: 'info', message: d.toString() }));
  proc.stderr.on('data', (d) => sendRosLog({ id, level: 'err', message: d.toString() }));
  proc.on('close', (code) => {
    running.delete(id);
    sendRosLog({ id, level: 'warn', message: `Process exited (${code})` });
  });
  return { ok: true };
});

ipcMain.handle('ros:stopNode', async (event, { id }) => {
  const proc = running.get(id);
  if (!proc) return { ok: false, reason: 'not_running' };
  proc.kill('SIGTERM');
  running.delete(id);
  return { ok: true };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
