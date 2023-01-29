const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sshModule', {
    connect_ssh_sync: opts => ipcRenderer.sendSync('connect_ssh_sync', opts),
    generate_keypair: (...args) => ipcRenderer.sendSync("generate_keypair", ...args),
    get_public_key: (...args) => ipcRenderer.sendSync("get_public_key", ...args),
    ssh_status: (callback) => ipcRenderer.on('ssh_status', callback),
    ssh_debug: (callback) => ipcRenderer.on('ssh_debug', callback),
    ssh_error: (callback) => ipcRenderer.on('ssh_error', callback)
});
