var app = require('app');  // Module to control application life.
app.commandLine.appendSwitch ('ignore-certificate-errors', 'true');
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
//require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;


// Make sure zmNinja is a single instance app, even if launched from 
// terminal
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  return true;
});

if (shouldQuit) {
  app.quit();
  return;
}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
  
});

// OSX only callback - takes care of spawning
// a new app window if needed
app.on('activate', function()
{
	if (mainWindow==null)
	{
  		mainWindow = new BrowserWindow({ 'node-integration':false, 'width':1024, 'height':900});
		mainWindow.loadUrl('file://' + __dirname + '/index.html');
  		mainWindow.on('closed', function() {

  	 		mainWindow = null;
  		});
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({'node-integration':false, 'width':1024, 'height':900});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

  	  mainWindow = null;
  });
});
