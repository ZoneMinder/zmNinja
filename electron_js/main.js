const electron = require('electron');
const windowStateKeeper = require('electron-window-state');
const {app, globalShortcut, Menu} = electron;
const {dialog} = require('electron')
const path = require('path');
const url = require('url');


// Module to create native browser window.
const {BrowserWindow} = electron;
var isFs = false;
var isProxy = false;
var argv = require('minimist')(process.argv.slice(1));



console.log ("ARGV="+JSON.stringify(argv));

if (argv.path) {
  console.log ("PATH SET TO "+argv.path);
  app.setPath("userData", argv.path);
  console.log ("switching storage to: "+app.getPath("userData"));
}



//
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
app.commandLine.appendSwitch ('ignore-certificate-errors', 'true');

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (myWindow) {
      if (myWindow.isMinimized()) myWindow.restore()
      myWindow.focus()
    }
  })
}

  
function newWindow() {
  createAlternateWindow();
}



function createAlternateWindow() {


  var newWin = new BrowserWindow({
    x: 10,
    y: 10,
    width: 800,
    height: 800,
    icon: path.join(__dirname, '/../resources/icon.png'),
    webPreferences:{nodeIntegration:false}});

    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '/../www/index.html'),
      protocol: 'file:',
      slashes: true
    });

    newWin.loadURL(startUrl);

}




function createWindow() {


// don't need these as we are using local menu bindings
/*const mx = globalShortcut.register('CommandOrControl+Alt+F', () => {

    console.log('Command Or Control+F is pressed');
    isFs = !isFs;
    win.setFullScreen(isFs);
  })

  const dbgx = globalShortcut.register('CommandOrControl+Alt+D', () => {
    console.log('CommandOrControl+Alt+D is pressed');
    win.webContents.openDevTools();
  })*/


  /*const newwinx = globalShortcut.register('CommandOrControl+Alt+N', () => {
    console.log('CommandOrControl+Alt+N is pressed');
    createAlternateWindow();
  })*/


  // Create the browser window.
  let mainWindowState = windowStateKeeper({
      //file: 'main.json',
      defaultWidth: 1000,
      defaultHeight: 800,
      webPreferences:{nodeIntegration:false}

   });
  win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        icon: path.join(__dirname, '/../resources/icon.png'),
        webPreferences:{nodeIntegration:false}});
//
    console.log (path.join(__dirname, '/../resources/icon.png'));




    win.webContents.session.webRequest.onHeadersReceived({}, (d, c) => {
    if(d.responseHeaders['x-frame-options'] || d.responseHeaders['X-Frame-Options']){
        delete d.responseHeaders['x-frame-options'];
        delete d.responseHeaders['X-Frame-Options'];
    }
    c({cancel: false, responseHeaders: d.responseHeaders});
  });

  mainWindowState.manage(win);
  // fs will be arg 1 if its not run in electron debug mode
  if (argv.fs)
  {
        win.setFullScreen(true);
        isFs = true;
  }


  if (argv.proxy) {
    console.log ("PROXY SET: "+argv.proxy);
       win.webContents.session.setProxy({proxyRules:argv.proxy}, function() {});
  }

  if (argv.debug) {
    // Open the DevTools.
    win.webContents.openDevTools();
  }
  //win.webContents.openDevTools();
  // and load the index.html of the app.

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/../www/index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);
  //win.loadURL(`file://${__dirname}/index.html`);

  // Create the Application's main menu

 // const menu = Menu.buildFromTemplate(template)
 // Menu.setApplicationMenu(menu)


 const template = [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools', accelerator: 'CmdOrCtrl+Shift+D'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen', accelerator: 'CmdOrCtrl+Shift+F'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'quit'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Edit menu
  template[1].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  )

  // Window menu
  template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);


// Emitted when the window is closed.
win.on('closed', () => {
  // Dereference the window object, usually you would store windows
  // in an array if your app supports multi windows, this is the time
  // when you should delete the corresponding element.
  win.removeAllListeners();
  win = null;
});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);



// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

console.log ("Setting uncaught exception handler...");
process.on('uncaughtException', function (err) {
  console.log("***WHOOPS TIME****"+err);
});

 
app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
});
