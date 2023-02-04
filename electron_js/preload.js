const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sshModule', {
    connect_ssh_sync: opts => ipcRenderer.sendSync('connect_ssh_sync', opts),
    generate_keypair: (...args) => ipcRenderer.sendSync("generate_keypair", ...args),
    get_public_key: (...args) => ipcRenderer.sendSync("get_public_key", ...args),
    network_online: (...args) => ipcRenderer.send("network_online", ...args),
    network_offline: (...args) => ipcRenderer.send("network_offline", ...args),
    ready: (callback) => ipcRenderer.on('ready', callback),
    debug: (callback) => ipcRenderer.on('debug', callback),
    error: (callback) => ipcRenderer.on('error', callback)
});
