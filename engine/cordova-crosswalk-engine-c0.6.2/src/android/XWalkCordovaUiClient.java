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

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.ValueCallback;
import android.widget.EditText;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.xwalk.core.XWalkJavascriptResult;
import org.xwalk.core.XWalkUIClient;
import org.xwalk.core.XWalkView;

/**
 * This class is the WebChromeClient that implements callbacks for our web view.
 * The kind of callbacks that happen here are on the chrome outside the document,
 * such as onCreateWindow(), onConsoleMessage(), onProgressChanged(), etc. Related
 * to but different than CordovaWebViewClient.
 */
public class XWalkCordovaUiClient extends XWalkUIClient {
    protected XWalkCordovaWebView appView;

    private static final int FILECHOOSER_RESULTCODE = 5173;

    public XWalkCordovaUiClient(XWalkCordovaWebView webView) {
        super(webView.getView());
        this.appView = webView;
    }

    @Override
    public boolean onJavascriptModalDialog(XWalkView view, JavascriptMessageType type, String url,
                                           String message, String defaultValue, XWalkJavascriptResult result) {
        switch (type) {
            case JAVASCRIPT_ALERT:
                return onJsAlert(view, url, message, result);
            case JAVASCRIPT_CONFIRM:
                return onJsConfirm(view, url, message, result);
            case JAVASCRIPT_PROMPT:
                return onJsPrompt(view, url, message, defaultValue, result);
            case JAVASCRIPT_BEFOREUNLOAD:
                // Reuse onJsConfirm to show the dialog.
                return onJsConfirm(view, url, message, result);
            default:
                break;
        }
        assert (false);
        return false;
    }

    /**
     * Tell the client to display a javascript alert dialog.
     *
     * @param view
     * @param url
     * @param message
     * @param result
     */
    private boolean onJsAlert(XWalkView view, String url, String message,
                              final XWalkJavascriptResult result) {
        AlertDialog.Builder dlg = new AlertDialog.Builder(appView.getView().getContext());
        dlg.setMessage(message);
        dlg.setTitle("Alert");
        //Don't let alerts break the back button
        dlg.setCancelable(true);
        dlg.setPositiveButton(android.R.string.ok,
                new AlertDialog.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                });
        dlg.setOnCancelListener(
                new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface dialog) {
                        result.cancel();
                    }
                });
        dlg.setOnKeyListener(new DialogInterface.OnKeyListener() {
            //DO NOTHING
            public boolean onKey(DialogInterface dialog, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK) {
                    result.confirm();
                    return false;
                } else
                    return true;
            }
        });
        dlg.create();
        dlg.show();
        return true;
    }

    /**
     * Tell the client to display a confirm dialog to the user.
     *
     * @param view
     * @param url
     * @param message
     * @param result
     */
    private boolean onJsConfirm(XWalkView view, String url, String message,
                                final XWalkJavascriptResult result) {
        AlertDialog.Builder dlg = new AlertDialog.Builder(appView.getView().getContext());
        dlg.setMessage(message);
        dlg.setTitle("Confirm");
        dlg.setCancelable(true);
        dlg.setPositiveButton(android.R.string.ok,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                });
        dlg.setNegativeButton(android.R.string.cancel,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        result.cancel();
                    }
                });
        dlg.setOnCancelListener(
                new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface dialog) {
                        result.cancel();
                    }
                });
        dlg.setOnKeyListener(new DialogInterface.OnKeyListener() {
            //DO NOTHING
            public boolean onKey(DialogInterface dialog, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK) {
                    result.cancel();
                    return false;
                } else
                    return true;
            }
        });
        dlg.create();
        dlg.show();
        return true;
    }

    /**
     * Tell the client to display a prompt dialog to the user.
     * If the client returns true, WebView will assume that the client will
     * handle the prompt dialog and call the appropriate JsPromptResult method.
     * <p/>
     * Since we are hacking prompts for our own purposes, we should not be using them for
     * this purpose, perhaps we should hack console.log to do this instead!
     */
    private boolean onJsPrompt(XWalkView view, String origin, String message, String defaultValue,
                               final XWalkJavascriptResult result) {
        // Unlike the @JavascriptInterface bridge, this method is always called on the UI thread.
        String handledRet = appView.bridge.promptOnJsPrompt(origin, message, defaultValue);
        if (handledRet != null) {
            result.confirmWithResult(handledRet);
        } else {
            AlertDialog.Builder dlg = new AlertDialog.Builder(appView.getView().getContext());
            dlg.setMessage(message);
            final EditText input = new EditText(appView.getView().getContext());
            if (defaultValue != null) {
                input.setText(defaultValue);
            }
            dlg.setView(input);
            dlg.setCancelable(false);
            dlg.setPositiveButton(android.R.string.ok,
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            String usertext = input.getText().toString();
                            result.confirmWithResult(usertext);
                        }
                    });
            dlg.setNegativeButton(android.R.string.cancel,
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            result.cancel();
                        }
                    });
            dlg.create();
            dlg.show();
        }
        return true;
    }

    /**
     * Notify the host application that a page has started loading.
     * This method is called once for each main frame load so a page with iframes or framesets will call onPageStarted
     * one time for the main frame. This also means that onPageStarted will not be called when the contents of an
     * embedded frame changes, i.e. clicking a link whose target is an iframe.
     *
     * @param view The webview initiating the callback.
     * @param url  The url of the page.
     */
    @Override
    public void onPageLoadStarted(XWalkView view, String url) {

        // Only proceed if this is a top-level navigation
        if (view.getUrl() != null && view.getUrl().equals(url)) {
            // Flush stale messages.
            appView.onPageReset();
            // Broadcast message that page has loaded
            appView.getPluginManager().postMessage("onPageStarted", url);
        }
    }

    /**
     * Notify the host application that a page has stopped loading.
     * This method is called only for main frame. When onPageLoadStopped() is called, the rendering picture may not be updated yet.
     *
     * @param view   The webview initiating the callback.
     * @param url    The url of the page.
     * @param status The load status of the webview, can be FINISHED, CANCELLED or FAILED.
     */
    @Override
    public void onPageLoadStopped(XWalkView view, String url, LoadStatus status) {
        LOG.d(XWalkCordovaResourceClient.TAG, "onPageFinished(" + url + ")");
        // Clear timeout flag
        appView.loadUrlTimeout++;

        // Broadcast message that page has loaded
        appView.getPluginManager().postMessage("onPageFinished", url);

        // Make app visible after 2 sec in case there was a JS error and Cordova JS never initialized correctly
        if (appView.getView().getVisibility() == View.INVISIBLE) {
            Thread t = new Thread(new Runnable() {
                public void run() {
                    try {
                        Thread.sleep(2000);
                        appView.cordova.getActivity().runOnUiThread(new Runnable() {
                            public void run() {
                                appView.getPluginManager().postMessage("spinner", "stop");
                            }
                        });
                    } catch (InterruptedException e) {
                    }
                }
            });
            t.start();
        }

        // Shutdown if blank loaded
        if (url.equals("about:blank")) {
            appView.getPluginManager().postMessage("exit", null);
        }
    }

    // File Chooser
    @Override
    public void openFileChooser(XWalkView view, final ValueCallback<Uri> uploadFile, String acceptType, String capture) {
        Intent i = new Intent(Intent.ACTION_GET_CONTENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*"); // TODO: wire this to acceptType.
        Intent intent = Intent.createChooser(i, "File Browser");
        try {
            appView.cordova.startActivityForResult(new CordovaPlugin() {
                @Override
                public void onActivityResult(int requestCode, int resultCode, Intent intent) {
                    Uri result = intent == null || resultCode != Activity.RESULT_OK ? null : intent.getData();
                    uploadFile.onReceiveValue(result);
                }
            }, intent, FILECHOOSER_RESULTCODE);
        } catch (ActivityNotFoundException e) {
            Log.w("No activity found to handle file chooser intent.", e);
            uploadFile.onReceiveValue(null);
        }
    }
}
