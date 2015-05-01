/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

package org.crosswalk.engine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

import org.apache.cordova.CordovaBridge;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPreferences;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.ICordovaCookieManager;
import org.apache.cordova.LOG;
import org.apache.cordova.NativeToJsMessageQueue;
import org.apache.cordova.PluginEntry;
import org.apache.cordova.PluginManager;
import org.apache.cordova.PluginResult;
import org.apache.cordova.Whitelist;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient.CustomViewCallback;
import android.widget.FrameLayout;

import org.xwalk.core.XWalkNavigationHistory;
import org.xwalk.core.XWalkNavigationItem;
import org.xwalk.core.XWalkPreferences;
import org.xwalk.core.XWalkView;
/*
 * This class is our web view.
 *
 * @see <a href="http://developer.android.com/guide/webapps/webview.html">WebView guide</a>
 * @see <a href="http://developer.android.com/reference/android/webkit/WebView.html">WebView</a>
 */
public class XWalkCordovaWebView implements CordovaWebView {

    public static final String TAG = "XWalkCordovaWebView";
    public static final String CORDOVA_VERSION = "3.3.0";

    HashSet<Integer> boundKeyCodes = new HashSet<Integer>();

    private PluginManager pluginManager;
    private BroadcastReceiver receiver;
    protected XWalkCordovaView webview;
    protected XWalkCordovaCookieManager cookieManager;

    /** Activities and other important classes **/
    CordovaInterface cordova;

    // Flag to track that a loadUrl timeout occurred
    int loadUrlTimeout = 0;

    CordovaBridge bridge;
    
    /** custom view created by the browser (a video player for example) */
    private View mCustomView;
    private CustomViewCallback mCustomViewCallback;

    private CordovaResourceApi resourceApi;
    private Whitelist internalWhitelist;
    private Whitelist externalWhitelist;
    private CordovaPreferences preferences;
    // The URL passed to loadUrl(), not necessarily the URL of the current page.
    private String loadedUrl;

    private static final FrameLayout.LayoutParams COVER_SCREEN_GRAVITY_CENTER =
            new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
            Gravity.CENTER);

    public XWalkCordovaWebView(Context context) {
        this(new XWalkCordovaView(context, null));
    }

    public XWalkCordovaWebView(XWalkCordovaView webView) {
        this.webview = webView;

        this.cookieManager = new XWalkCordovaCookieManager();
    }

    // Use two-phase init so that the control will work with XML layouts.
    @Override
    public void init(final CordovaInterface cordova, List<PluginEntry> pluginEntries,
            Whitelist internalWhitelist, Whitelist externalWhitelist,
            CordovaPreferences preferences) {
        if (this.cordova != null) {
            throw new IllegalStateException();
        }
        this.cordova = cordova;
        this.internalWhitelist = internalWhitelist;
        this.externalWhitelist = externalWhitelist;
        this.preferences = preferences;

        pluginManager = new PluginManager(this, this.cordova, pluginEntries);
        resourceApi = new CordovaResourceApi(webview.getContext(), pluginManager);
        NativeToJsMessageQueue nativeToJsMessageQueue = new NativeToJsMessageQueue();
        nativeToJsMessageQueue.addBridgeMode(new NativeToJsMessageQueue.NoOpBridgeMode());
        nativeToJsMessageQueue.addBridgeMode(new NativeToJsMessageQueue.LoadUrlBridgeMode(this, cordova));
        nativeToJsMessageQueue.addBridgeMode(new NativeToJsMessageQueue.OnlineEventsBridgeMode(new NativeToJsMessageQueue.OnlineEventsBridgeMode.OnlineEventsBridgeModeDelegate() {
            @Override
            public void setNetworkAvailable(boolean value) {
                XWalkCordovaWebView.this.setNetworkAvailable(value);
            }

            @Override
            public void runOnUiThread(Runnable r) {
                cordova.getActivity().runOnUiThread(r);
            }
        }));
        bridge = new CordovaBridge(pluginManager, nativeToJsMessageQueue, this.cordova.getActivity().getPackageName());
        pluginManager.addService("CoreAndroid", "org.apache.cordova.CoreAndroid");
        initWebViewSettings();

        webview.init(this);
        exposeJsInterface();

        if (preferences.getBoolean("DisallowOverscroll", false)) {
            webview.setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void initWebViewSettings() {
        webview.setVerticalScrollBarEnabled(false);
        // TODO: The Activity is the one that should call requestFocus().
        if (shouldRequestFocusOnInit()) {
            this.webview.requestFocusFromTouch();
        }
        
        //Determine whether we're in debug or release mode, and turn on Debugging!
        ApplicationInfo appInfo = webview.getContext().getApplicationContext().getApplicationInfo();
        if ((appInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            XWalkPreferences.setValue(XWalkPreferences.REMOTE_DEBUGGING, true);
        }
    }

    /**
	 * Override this method to decide whether or not you need to request the
	 * focus when your application start
	 *
	 * @return true unless this method is overriden to return a different value
	 */
    protected boolean shouldRequestFocusOnInit() {
		return true;
	}

    private void exposeJsInterface() {
        XWalkExposedJsApi exposedJsApi = new XWalkExposedJsApi(bridge);
        this.webview.addJavascriptInterface(exposedJsApi, "_cordovaNative");
    }

    /**
     * Load the url into the webview.
     */
    @Override
    public void loadUrlIntoView(final String url, boolean recreatePlugins) {
        if (url.equals("about:blank") || url.startsWith("javascript:")) {
            webview.load(url, null);
            return;
        }
        
        LOG.d(TAG, ">>> loadUrl(" + url + ")");
        recreatePlugins = recreatePlugins || (loadedUrl == null);

        if (recreatePlugins) {
            this.loadedUrl = url;
            this.pluginManager.init();
        }

        // Create a timeout timer for loadUrl
        final XWalkCordovaWebView me = this;
        final int currentLoadUrlTimeout = me.loadUrlTimeout;
        final int loadUrlTimeoutValue = preferences.getInteger("LoadUrlTimeoutValue", 20000);

        // Timeout error method
        final Runnable loadError = new Runnable() {
            public void run() {
                me.webview.stopLoading();
                LOG.e(TAG, "CordovaWebView: TIMEOUT ERROR!");
                onReceivedLoadError(-6, "The connection to the server was unsuccessful.", url);
            }
        };

        // Timeout timer method
        final Runnable timeoutCheck = new Runnable() {
            public void run() {
                try {
                    synchronized (this) {
                        wait(loadUrlTimeoutValue);
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                // If timeout, then stop loading and handle error
                if (me.loadUrlTimeout == currentLoadUrlTimeout) {
                    me.cordova.getActivity().runOnUiThread(loadError);
                }
            }
        };

        // Load url
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                Thread thread = new Thread(timeoutCheck);
                thread.start();
                if (url.startsWith("file://") || url.startsWith("javascript:") || internalWhitelist.isUrlWhiteListed(url)) {
                    webview.load(url, null);
                }
            }
        });
    }

    void onReceivedLoadError(int errorCode, String description, String failingUrl) {
        LOG.d(TAG, "CordovaWebViewClient.onReceivedError: Error code=%s Description=%s URL=%s", errorCode, description, failingUrl);

        // Clear timeout flag
        loadUrlTimeout++;

        // Convert the XWalk error code to Cordova error code, which follows the Android spec,
        // http://developer.android.com/reference/android/webkit/WebViewClient.html.
        errorCode = XWalkCordovaResourceClient.convertErrorCode(errorCode);

        // Handle error
        JSONObject data = new JSONObject();
        try {
            data.put("errorCode", errorCode);
            data.put("description", description);
            data.put("url", failingUrl);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        pluginManager.postMessage("onReceivedError", data);
    }

    // TODO(ningxin): XWalkViewUIClient should provide onScrollChanged callback
    /*
    public void onScrollChanged(int l, int t, int oldl, int oldt)
    {
        super.onScrollChanged(l, t, oldl, oldt);
        //We should post a message that the scroll changed
        ScrollEvent myEvent = new ScrollEvent(l, t, oldl, oldt, this);
        this.postMessage("onScrollChanged", myEvent);
    }
    */

    /**
     * Send JavaScript statement back to JavaScript.
     */
    @Override
    public void sendJavascript(String statement) {
        bridge.getMessageQueue().addJavaScript(statement);
    }

    /**
     * Send a plugin result back to JavaScript.
     * (This is a convenience method)
     */
    @Override
    public void sendPluginResult(PluginResult result, String callbackId) {
        bridge.getMessageQueue().addPluginResult(result, callbackId);
    }

    /**
     * Go to previous page in history.  (We manage our own history)
     *
     * @return true if we went back, false if we are already at top
     */
    @Override
    public boolean backHistory() {

        // Check webview first to see if there is a history
        // This is needed to support curPage#diffLink, since they are added to appView's history, but not our history url array (JQMobile behavior)
        if (this.webview.getNavigationHistory().canGoBack()) {
            printBackForwardList();
            this.webview.getNavigationHistory().navigate(XWalkNavigationHistory.Direction.BACKWARD, 1);

            return true;
        }
        return false;
    }


    /**
     * Load the specified URL in the Cordova webview or a new browser instance.
     *
     * NOTE: If openExternal is false, only URLs listed in whitelist can be loaded.
     *
     * @param url           The url to load.
     * @param openExternal  Load url in browser instead of Cordova webview.
     * @param clearHistory  Clear the history stack, so new page becomes top of history
     * @param params        Parameters for new app
     */
    @Override
    public void showWebPage(String url, boolean openExternal, boolean clearHistory, HashMap<String, Object> params) {
        LOG.d(TAG, "showWebPage(%s, %b, %b, HashMap", url, openExternal, clearHistory);

        // If clearing history
        if (clearHistory) {
            this.clearHistory();
        }

        // If loading into our webview
        if (!openExternal) {

            // Make sure url is in whitelist
            if (url.startsWith("file://") || internalWhitelist.isUrlWhiteListed(url)) {
                // TODO: What about params?
                // Load new URL
                this.loadUrlIntoView(url, true);
            }
            // Load in default viewer if not
            else {
                LOG.w(TAG, "showWebPage: Cannot load URL into webview since it is not in white list.  Loading into browser instead. (URL=" + url + ")");
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    cordova.getActivity().startActivity(intent);
                } catch (android.content.ActivityNotFoundException e) {
                    LOG.e(TAG, "Error loading url " + url, e);
                }
            }
        }

        // Load in default view intent
        else {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(url));
                cordova.getActivity().startActivity(intent);
            } catch (android.content.ActivityNotFoundException e) {
                LOG.e(TAG, "Error loading url " + url, e);
            }
        }
    }

    @Override
    public void setButtonPlumbedToJs(int keyCode, boolean override) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_VOLUME_DOWN:
            case KeyEvent.KEYCODE_VOLUME_UP:
            case KeyEvent.KEYCODE_BACK:
                // TODO: Why are search and menu buttons handled separately?
                if (override) {
                    boundKeyCodes.add(keyCode);
                } else {
                    boundKeyCodes.remove(keyCode);
                }
                return;
            default:
                throw new IllegalArgumentException("Unsupported keycode: " + keyCode);
        }
    }

    @Override
    public boolean isButtonPlumbedToJs(int keyCode)
    {
        return boundKeyCodes.contains(keyCode);
    }

    @Override
    public void handlePause(boolean keepRunning)
    {
        LOG.d(TAG, "Handle the pause");
        // Send pause event to JavaScript
        webview.evaluateJavascript("try{cordova.fireDocumentEvent('pause');}catch(e){console.log('exception firing pause event from native');};", null);

        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onPause(keepRunning);
        }

        // If app doesn't want to run in background
        if (!keepRunning) {
            // Pause JavaScript timers (including setInterval)
            this.webview.pauseTimersForReal();
        }
    }

    @Override
    public void handleResume(boolean keepRunning)
    {
        webview.evaluateJavascript("try{cordova.fireDocumentEvent('resume');}catch(e){console.log('exception firing resume event from native');};", null);

        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onResume(keepRunning);
        }

        // Resume JavaScript timers (including setInterval)
        this.webview.resumeTimers();
    }

    @Override
    public void handleDestroy()
    {
        // Cancel pending timeout timer.
        loadUrlTimeout++;

        // Send destroy event to JavaScript
        webview.load("javascript:try{cordova.require('cordova/channel').onDestroy.fire();}catch(e){console.log('exception firing destroy event from native');};", null);

        // Load blank page so that JavaScript onunload is called
        loadUrlIntoView("about:blank", false);

        // Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onDestroy();
        }

        // unregister the receiver
        if (this.receiver != null) {
            try {
                this.cordova.getActivity().unregisterReceiver(this.receiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering configuration receiver: " + e.getMessage(), e);
            }
        }

        this.webview.onDestroy();
    }

    @Override
    public void onNewIntent(Intent intent)
    {
    	if (this.webview.onNewIntent(intent)) return;
        //Forward to plugins
        if (this.pluginManager != null) {
            this.pluginManager.onNewIntent(intent);
        }
        return;
    }

    public void printBackForwardList() {
    	XWalkNavigationHistory currentList = this.webview.getNavigationHistory();
    	int currentSize = currentList.size();
        LOG.d(TAG, "My URL is " + webview.getUrl());
        LOG.d(TAG, "navigation history:");
        for(int i = 0; i < currentSize; ++i)
        {
        	XWalkNavigationItem item = currentList.getItemAt(i);
            String url = item.getUrl();
            LOG.d(TAG, "The URL at index: " + Integer.toString(i) + " is " + url );
        }
    }


    //Can Go Back is BROKEN!
    public boolean startOfHistory()
    {
    	XWalkNavigationHistory currentList = this.webview.getNavigationHistory();
    	XWalkNavigationItem item = currentList.getItemAt(0);
        if( item!=null){	// Null-fence in case they haven't called loadUrl yet (CB-2458)
	        String url = item.getUrl();
	        String currentUrl = this.webview.getUrl();
	        LOG.d(TAG, "The current URL is: " + currentUrl);
	        LOG.d(TAG, "The URL at item 0 is: " + url);
	        return currentUrl.equals(url);
        }
        return false;
    }

    @Override
    public void showCustomView(View view, CustomViewCallback callback) {
        // This code is adapted from the original Android Browser code, licensed under the Apache License, Version 2.0
        Log.d(TAG, "showing Custom View");
        // if a view already exists then immediately terminate the new one
        if (mCustomView != null) {
            callback.onCustomViewHidden();
            return;
        }

        // Store the view and its callback for later (to kill it properly)
        mCustomView = view;
        mCustomViewCallback = callback;

        // Add the custom view to its container.
        ViewGroup parent = (ViewGroup) webview.getParent();
        parent.addView(view, COVER_SCREEN_GRAVITY_CENTER);

        // Hide the content view.
        webview.setVisibility(View.GONE);

        // Finally show the custom view container.
        parent.setVisibility(View.VISIBLE);
        parent.bringToFront();
    }

    @Override
    public void hideCustomView() {
        // This code is adapted from the original Android Browser code, licensed under the Apache License, Version 2.0
        Log.d(TAG, "Hidding Custom View");
        if (mCustomView == null) return;

        // Hide the custom view.
        mCustomView.setVisibility(View.GONE);

        // Remove the custom view from its container.
        ViewGroup parent = (ViewGroup) webview.getParent();
        parent.removeView(mCustomView);
        mCustomView = null;
        mCustomViewCallback.onCustomViewHidden();

        // Show the content view.
        webview.setVisibility(View.VISIBLE);
    }

    /**
     * if the video overlay is showing then we need to know
     * as it effects back button handling
     *
     * @return true if custom view is showing
     */
    public boolean isCustomViewShowing() {
        return mCustomView != null;
    }

    public boolean restoreState(Bundle savedInstanceState)
    {
    	boolean result = this.webview.restoreState(savedInstanceState);
        Log.d(TAG, "WebView restoration crew now restoring!");
        //Initialize the plugin manager once more
        this.pluginManager.init();
        return result;
    }

    public CordovaResourceApi getResourceApi() {
        return resourceApi;
    }

    @Override
    public boolean canGoBack() {
        return this.webview.getNavigationHistory().canGoBack();
    }

    @Override
    public void clearCache(boolean b) {
        this.webview.clearCache(b);
    }

    @Override
    public void clearHistory() {
        // TODO Auto-generated method stub
    	this.webview.getNavigationHistory().clear();
    }

    void onPageReset() {
        boundKeyCodes.clear();
        pluginManager.onReset();
        bridge.reset(loadedUrl);
    }

    @Override
    public void setNetworkAvailable(boolean online) {
        this.webview.setNetworkAvailable(online);
    }

    @Override
    public PluginManager getPluginManager() {
        return this.pluginManager;
    }

	@Override
    public XWalkView getView() {
    	return this.webview;
    }

    @Override
    public void stopLoading() {
        this.webview.stopLoading();
    }

    @Override
    public String getUrl() {
        return this.webview.getUrl();
    }

    @Override
    public Whitelist getWhitelist() {
        return internalWhitelist;
    }

    @Override
    public Whitelist getExternalWhitelist() {
        return externalWhitelist;
    }

    @Override
    public CordovaPreferences getPreferences() {
        return preferences;
    }
    
    @Override
    public ICordovaCookieManager getCookieManager() {
        return cookieManager;
    }

    @Override
    public Object postMessage(String id, Object data) {
        return pluginManager.postMessage(id, data);
    }

    @Override
    public Context getContext() {
        return webview.getContext();
    }

    @Override
    public void loadUrl(String url) {
        loadUrlIntoView(url, true);
    }

    static {
        // XWalkPreferencesInternal.ENABLE_JAVASCRIPT
        XWalkPreferences.setValue("enable-javascript", true);
        // XWalkPreferencesInternal.JAVASCRIPT_CAN_OPEN_WINDOW
        XWalkPreferences.setValue("javascript-can-open-window", true);
        // XWalkPreferencesInternal.ALLOW_UNIVERSAL_ACCESS_FROM_FILE
        XWalkPreferences.setValue("allow-universal-access-from-file", true);
    }
}
