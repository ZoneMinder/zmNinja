using System;
using System.Windows;
using System.Windows.Navigation;
using Microsoft.Phone.Controls;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;
using Windows.ApplicationModel;
using System.Xml.Linq;

namespace Cordova.Extension.Commands
{
    public class AppVersion : BaseCommand
    {
        public void getVersionNumber(string empty)
        {
            //Windows.ApplicationModel.Package.current.id.version is NOT working in Windows Phone 8
            //Workaround based on http://stackoverflow.com/questions/14371275/how-can-i-get-my-windows-store-apps-title-and-version-info
            String version= XDocument.Load("WMAppManifest.xml").Root.Element("App").Attribute("Version").Value;

            this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, version));
        }
    }
}
