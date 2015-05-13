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
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.webkit.ValueCallback;

import org.apache.cordova.CordovaDialogsHelper;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.xwalk.core.XWalkJavascriptResult;
import org.xwalk.core.XWalkUIClient;
import org.xwalk.core.XWalkView;

public class XWalkCordovaUiClient extends XWalkUIClient {
    private static final String TAG = "XWalkCordovaUiClient";
    protected final CordovaDialogsHelper dialogsHelper;
    protected final XWalkWebViewEngine parentEngine;

    private static final int FILECHOOSER_RESULTCODE = 5173;

    public XWalkCordovaUiClient(XWalkWebViewEngine parentEngine) {
        super(parentEngine.webView);
        this.parentEngine = parentEngine;
        dialogsHelper = new CordovaDialogsHelper(parentEngine.webView.getContext());
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
     */
    private boolean onJsAlert(XWalkView view, String url, String message,
                              final XWalkJavascriptResult result) {
        dialogsHelper.showAlert(message, new CordovaDialogsHelper.Result() {
            @Override
            public void gotResult(boolean success, String value) {
                if (success) {
                    result.confirm();
                } else {
                    result.cancel();
                }
            }
        });
        return true;
    }

    /**
     * Tell the client to display a confirm dialog to the user.
     */
    private boolean onJsConfirm(XWalkView view, String url, String message,
                                final XWalkJavascriptResult result) {
        dialogsHelper.showConfirm(message, new CordovaDialogsHelper.Result() {
            @Override
            public void gotResult(boolean success, String value) {
                if (success) {
                    result.confirm();
                } else {
                    result.cancel();
                }
            }
        });
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
        String handledRet = parentEngine.bridge.promptOnJsPrompt(origin, message, defaultValue);
        if (handledRet != null) {
            result.confirmWithResult(handledRet);
        } else {
            dialogsHelper.showPrompt(message, defaultValue, new CordovaDialogsHelper.Result() {
                @Override
                public void gotResult(boolean success, String value) {
                    if (success) {
                        result.confirmWithResult(value);
                    } else {
                        result.cancel();
                    }
                }
            });

        }
        return true;
    }

    /**
     * Notify the host application that a page has started loading.
     * This method is called once for each main frame load so a page with iframes or framesets will call onPageStarted
     * one time for the main frame. This also means that onPageStarted will not be called when the contents of an
     * embedded frame changes, i.e. clicking a link whose target is an iframe.
     *
     * @param view The webView initiating the callback.
     * @param url  The url of the page.
     */
    @Override
    public void onPageLoadStarted(XWalkView view, String url) {

        // Only proceed if this is a top-level navigation
        if (view.getUrl() != null && view.getUrl().equals(url)) {
            // Flush stale messages.
            parentEngine.client.onPageStarted(url);
            parentEngine.bridge.reset();
        }
    }

    /**
     * Notify the host application that a page has stopped loading.
     * This method is called only for main frame. When onPageLoadStopped() is called, the rendering picture may not be updated yet.
     *
     * @param view   The webView initiating the callback.
     * @param url    The url of the page.
     * @param status The load status of the webView, can be FINISHED, CANCELLED or FAILED.
     */
    @Override
    public void onPageLoadStopped(XWalkView view, String url, LoadStatus status) {
        LOG.d(TAG, "onPageFinished(" + url + ")");
        if (status == LoadStatus.FINISHED) {
            parentEngine.client.onPageFinishedLoading(url);
        } else if (status == LoadStatus.FAILED) {
            // TODO: Should this call parentEngine.client.onReceivedError()?
            // Right now we call this from ResourceClient, but maybe that is just for sub-resources?
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
            parentEngine.cordova.startActivityForResult(new CordovaPlugin() {
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
