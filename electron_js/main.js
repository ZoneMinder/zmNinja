const electron = require('electron');
const windowStateKeeper = require('electron-window-state');
const {app, globalShortcut} = electron;
const {dialog} = require('electron')

// Module to create native browser window.
const {BrowserWindow} = electron;
var isFs = false;
var argv = require('minimist')(process.argv.slice(1));

console.log ("ARGV="+JSON.stringify(argv));

if (argv.path) {
  console.log ("PATH SET TO "+argv.path);
  app.setPath("userData", argv.path);
  console.log ("switching storage to: "+app.getPath("userData"));
}




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
app.commandLine.appendSwitch ('ignore-certificate-errors', 'true');

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}


function createWindow() {


const mx = globalShortcut.register('CommandOrControl+Alt+F', () => {

    console.log('Command Or Control+F is pressed');
    isFs = !isFs;
    win.setFullScreen(isFs);
  })

  const dbgx = globalShortcut.register('CommandOrControl+Alt+D', () => {
    console.log('CommandOrControl+Alt+D is pressed');
    win.webContents.openDevTools();
  })


  // Create the browser window.
  let mainWindowState = windowStateKeeper({
      defaultWidth: 1000,
      defaultHeight: 800,
      webPreferences:{nodeIntegration:false}

   });
  win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        webPreferences:{nodeIntegration:false}});

  mainWindowState.manage(win);
  // fs will be arg 1 if its not run in electron debug mode
  if (argv.fs)
  {
        win.setFullScreen(true);
        isFs = true;
  }

    

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
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

app.on('uncaughtException', function (err) {
  console.log("***WHOOPS TIME****"+err);
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
});
