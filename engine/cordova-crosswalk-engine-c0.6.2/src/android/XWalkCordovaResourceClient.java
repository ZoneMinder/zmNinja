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

import java.io.FileNotFoundException;
import java.io.IOException;

import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaUriHelper;
import org.apache.cordova.CordovaResourceApi.OpenForReadResult;
import org.apache.cordova.LOG;

import android.annotation.TargetApi;
import android.net.Uri;
import android.os.Build;
import android.webkit.WebResourceResponse;

import org.chromium.net.NetError;
import org.xwalk.core.XWalkResourceClient;
import org.xwalk.core.XWalkView;

/**
 * This class is the WebViewClient that implements callbacks for our web view.
 * The kind of callbacks that happen here are regarding the rendering of the
 * document instead of the chrome surrounding it, such as onPageStarted(), 
 * shouldOverrideUrlLoading(), etc. Related to but different than
 * CordovaChromeClient.
 *
 * @see <a href="http://developer.android.com/reference/android/webkit/WebViewClient.html">WebViewClient</a>
 * @see <a href="http://developer.android.com/guide/webapps/webview.html">WebView guide</a>
 * @see XwalkCordovaChromeClient
 * @see XWalkCordovaWebView
 */
@TargetApi(Build.VERSION_CODES.HONEYCOMB)
public class XWalkCordovaResourceClient extends XWalkResourceClient {

	static final String TAG = "XWalkCordovaWebViewClient";
    XWalkCordovaWebView appView;
    private CordovaUriHelper helper;

    // Success
    public static final int ERROR_OK = 0;
    // Generic error
    public static final int ERROR_UNKNOWN = -1;
    // Server or proxy hostname lookup failed
    public static final int ERROR_HOST_LOOKUP = -2;
    // Unsupported authentication scheme (not basic or digest)
    public static final int ERROR_UNSUPPORTED_AUTH_SCHEME = -3;
    // User authentication failed on server
    public static final int ERROR_AUTHENTICATION = -4;
    // User authentication failed on proxy
    public static final int ERROR_PROXY_AUTHENTICATION = -5;
    // Failed to connect to the server
    public static final int ERROR_CONNECT = -6;
    // Failed to read or write to the server
    public static final int ERROR_IO = -7;
    // Connection timed out
    public static final int ERROR_TIMEOUT = -8;
    // Too many redirects
    public static final int ERROR_REDIRECT_LOOP = -9;
    // Unsupported URI scheme
    public static final int ERROR_UNSUPPORTED_SCHEME = -10;
    // Failed to perform SSL handshake
    public static final int ERROR_FAILED_SSL_HANDSHAKE = -11;
    // Malformed URL
    public static final int ERROR_BAD_URL = -12;
    // Generic file error
    public static final int ERROR_FILE = -13;
    // File not found
    public static final int ERROR_FILE_NOT_FOUND = -14;
    // Too many requests during this load
    public static final int ERROR_TOO_MANY_REQUESTS = -15;

    public XWalkCordovaResourceClient(XWalkCordovaWebView view) {
        super(view.getView());
        appView = view;
        helper = new CordovaUriHelper(appView.cordova, appView);
    }

    // Map XWalk error code about loading a page to Android specific ones.
    // XWalk shares the error code with chromium currently.
    static int convertErrorCode(int netError) {
        // Note: many NetError.Error constants don't have an obvious mapping.
        // These will be handled by the default case, ERROR_UNKNOWN.
        switch (netError) {
            case NetError.ERR_UNSUPPORTED_AUTH_SCHEME:
                return ERROR_UNSUPPORTED_AUTH_SCHEME;

            case NetError.ERR_INVALID_AUTH_CREDENTIALS:
            case NetError.ERR_MISSING_AUTH_CREDENTIALS:
            case NetError.ERR_MISCONFIGURED_AUTH_ENVIRONMENT:
                return ERROR_AUTHENTICATION;

            case NetError.ERR_TOO_MANY_REDIRECTS:
                return ERROR_REDIRECT_LOOP;

            case NetError.ERR_UPLOAD_FILE_CHANGED:
                return ERROR_FILE_NOT_FOUND;

            case NetError.ERR_INVALID_URL:
                return ERROR_BAD_URL;

            case NetError.ERR_DISALLOWED_URL_SCHEME:
            case NetError.ERR_UNKNOWN_URL_SCHEME:
                return ERROR_UNSUPPORTED_SCHEME;

            case NetError.ERR_IO_PENDING:
            case NetError.ERR_NETWORK_IO_SUSPENDED:
                return ERROR_IO;

            case NetError.ERR_CONNECTION_TIMED_OUT:
            case NetError.ERR_TIMED_OUT:
                return ERROR_TIMEOUT;

            case NetError.ERR_FILE_TOO_BIG:
                return ERROR_FILE;

            case NetError.ERR_HOST_RESOLVER_QUEUE_TOO_LARGE:
            case NetError.ERR_INSUFFICIENT_RESOURCES:
            case NetError.ERR_OUT_OF_MEMORY:
                return ERROR_TOO_MANY_REQUESTS;

            case NetError.ERR_CONNECTION_CLOSED:
            case NetError.ERR_CONNECTION_RESET:
            case NetError.ERR_CONNECTION_REFUSED:
            case NetError.ERR_CONNECTION_ABORTED:
            case NetError.ERR_CONNECTION_FAILED:
            case NetError.ERR_SOCKET_NOT_CONNECTED:
                return ERROR_CONNECT;

            case NetError.ERR_INTERNET_DISCONNECTED:
            case NetError.ERR_ADDRESS_INVALID:
            case NetError.ERR_ADDRESS_UNREACHABLE:
            case NetError.ERR_NAME_NOT_RESOLVED:
            case NetError.ERR_NAME_RESOLUTION_FAILED:
                return ERROR_HOST_LOOKUP;

            case NetError.ERR_SSL_PROTOCOL_ERROR:
            case NetError.ERR_SSL_CLIENT_AUTH_CERT_NEEDED:
            case NetError.ERR_TUNNEL_CONNECTION_FAILED:
            case NetError.ERR_NO_SSL_VERSIONS_ENABLED:
            case NetError.ERR_SSL_VERSION_OR_CIPHER_MISMATCH:
            case NetError.ERR_SSL_RENEGOTIATION_REQUESTED:
            case NetError.ERR_CERT_ERROR_IN_SSL_RENEGOTIATION:
            case NetError.ERR_BAD_SSL_CLIENT_AUTH_CERT:
            case NetError.ERR_SSL_NO_RENEGOTIATION:
            case NetError.ERR_SSL_DECOMPRESSION_FAILURE_ALERT:
            case NetError.ERR_SSL_BAD_RECORD_MAC_ALERT:
            case NetError.ERR_SSL_UNSAFE_NEGOTIATION:
            case NetError.ERR_SSL_WEAK_SERVER_EPHEMERAL_DH_KEY:
            case NetError.ERR_SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED:
            case NetError.ERR_SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY:
                return ERROR_FAILED_SSL_HANDSHAKE;

            case NetError.ERR_PROXY_AUTH_UNSUPPORTED:
            case NetError.ERR_PROXY_AUTH_REQUESTED:
            case NetError.ERR_PROXY_CONNECTION_FAILED:
            case NetError.ERR_UNEXPECTED_PROXY_AUTH:
                return ERROR_PROXY_AUTHENTICATION;

            // The certificate errors are handled by onReceivedSslError
            // and don't need to be reported here.
            case NetError.ERR_CERT_COMMON_NAME_INVALID:
            case NetError.ERR_CERT_DATE_INVALID:
            case NetError.ERR_CERT_AUTHORITY_INVALID:
            case NetError.ERR_CERT_CONTAINS_ERRORS:
            case NetError.ERR_CERT_NO_REVOCATION_MECHANISM:
            case NetError.ERR_CERT_UNABLE_TO_CHECK_REVOCATION:
            case NetError.ERR_CERT_REVOKED:
            case NetError.ERR_CERT_INVALID:
            case NetError.ERR_CERT_WEAK_SIGNATURE_ALGORITHM:
            case NetError.ERR_CERT_NON_UNIQUE_NAME:
                return ERROR_OK;

            default:
                return ERROR_UNKNOWN;
        }
    }

    /**
    * Report an error to the host application. These errors are unrecoverable (i.e. the main resource is unavailable).
    * The errorCode parameter corresponds to one of the ERROR_* constants.
    *
    * @param view          The WebView that is initiating the callback.
    * @param errorCode     The error code corresponding to an ERROR_* value.
    * @param description   A String describing the error.
    * @param failingUrl    The url that failed to load.
    */
    @Override
    public void onReceivedLoadError(XWalkView view, int errorCode, String description,
           String failingUrl) {
       this.appView.onReceivedLoadError(errorCode, description, failingUrl);
    }

    @Override
    public WebResourceResponse shouldInterceptLoadRequest(XWalkView view, String url) {
        try {
            // Check the against the white-list.
            if ((url.startsWith("http:") || url.startsWith("https:")) && !appView.getWhitelist().isUrlWhiteListed(url)) {
                LOG.w(TAG, "URL blocked by whitelist: " + url);
                // Results in a 404.
                return new WebResourceResponse("text/plain", "UTF-8", null);
            }

            CordovaResourceApi resourceApi = appView.getResourceApi();
            Uri origUri = Uri.parse(url);
            // Allow plugins to intercept WebView requests.
            Uri remappedUri = resourceApi.remapUri(origUri);

            if (!origUri.equals(remappedUri)) {
                OpenForReadResult result = resourceApi.openForRead(remappedUri, true);
                return new WebResourceResponse(result.mimeType, "UTF-8", result.inputStream);
            }
            // If we don't need to special-case the request, let the browser load it.
            return null;
        } catch (IOException e) {
            if (!(e instanceof FileNotFoundException)) {
                LOG.e("IceCreamCordovaWebViewClient", "Error occurred while loading a file (returning a 404).", e);
            }
            // Results in a 404.
            return new WebResourceResponse("text/plain", "UTF-8", null);
        }
    }

    @Override
    public boolean shouldOverrideUrlLoading(XWalkView view, String url) {
        return helper.shouldOverrideUrlLoading(url);
    }
}
