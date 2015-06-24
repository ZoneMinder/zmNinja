/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.HashMap;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.HostnameVerifier;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.AssetManager;
import android.util.Base64;
import android.util.Log;

import com.github.kevinsawicki.http.HttpRequest;

public class CordovaHttpPlugin extends CordovaPlugin {
    private static final String TAG = "CordovaHTTP";

    private HashMap<String, String> globalHeaders;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.globalHeaders = new HashMap<String, String>();
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("get")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            HashMap<?, ?> paramsMap = this.getMapFromJSONObject(params);
            HashMap<String, String> headersMap = this.addToMap(this.globalHeaders, headers);
            CordovaHttpGet get = new CordovaHttpGet(urlString, paramsMap, headersMap, callbackContext);
            cordova.getThreadPool().execute(get);
        } else if (action.equals("post")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            HashMap<?, ?> paramsMap = this.getMapFromJSONObject(params);
            HashMap<String, String> headersMap = this.addToMap(this.globalHeaders, headers);
            CordovaHttpPost post = new CordovaHttpPost(urlString, paramsMap, headersMap, callbackContext);
            cordova.getThreadPool().execute(post);
        } else if (action.equals("useBasicAuth")) {
            String username = args.getString(0);
            String password = args.getString(1);
            this.useBasicAuth(username, password);
            callbackContext.success();
        } else if (action.equals("enableSSLPinning")) {
            try {
                boolean enable = args.getBoolean(0);
                this.enableSSLPinning(enable);
                callbackContext.success();
            } catch(Exception e) {
                e.printStackTrace();
                callbackContext.error("There was an error setting up ssl pinning");
            }
        } else if (action.equals("acceptAllCerts")) {
            boolean accept = args.getBoolean(0);
            CordovaHttp.acceptAllCerts(accept);
        } else if (action.equals("setHeader")) {
            String header = args.getString(0);
            String value = args.getString(1);
            this.setHeader(header, value);
            callbackContext.success();
        } else if (action.equals("uploadFile")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            HashMap<?, ?> paramsMap = this.getMapFromJSONObject(params);
            HashMap<String, String> headersMap = this.addToMap(this.globalHeaders, headers);
            String filePath = args.getString(3);
            String name = args.getString(4);
            CordovaHttpUpload upload = new CordovaHttpUpload(urlString, paramsMap, headersMap, callbackContext, filePath, name);
            cordova.getThreadPool().execute(upload);
        } else if (action.equals("downloadFile")) {
            String urlString = args.getString(0);
            JSONObject params = args.getJSONObject(1);
            JSONObject headers = args.getJSONObject(2);
            HashMap<?, ?> paramsMap = this.getMapFromJSONObject(params);
            HashMap<String, String> headersMap = this.addToMap(this.globalHeaders, headers);
            String filePath = args.getString(3);
            CordovaHttpDownload download = new CordovaHttpDownload(urlString, paramsMap, headersMap, callbackContext, filePath);
            cordova.getThreadPool().execute(download);
        } else {
            return false;
        }
        return true;
    }

    private void useBasicAuth(String username, String password) {
        String loginInfo = username + ":" + password;
        loginInfo = "Basic " + Base64.encodeToString(loginInfo.getBytes(), Base64.NO_WRAP);
        this.globalHeaders.put("Authorization", loginInfo);
    }

    private void setHeader(String header, String value) {
        this.globalHeaders.put(header, value);
    }

    private void enableSSLPinning(boolean enable) throws GeneralSecurityException, IOException {
        if (enable) {
            AssetManager assetManager = cordova.getActivity().getAssets();
            String[] files = assetManager.list("");
            int index;
            ArrayList<String> cerFiles = new ArrayList<String>();
            for (int i = 0; i < files.length; i++) {
                index = files[i].lastIndexOf('.');
                if (index != -1) {
                    if (files[i].substring(index).equals(".cer")) {
                        cerFiles.add(files[i]);
                    }
                }
            }

            // scan the www/certificates folder for .cer files as well
            files = assetManager.list("www/certificates");
            for (int i = 0; i < files.length; i++) {
              index = files[i].lastIndexOf('.');
              if (index != -1) {
                if (files[i].substring(index).equals(".cer")) {
                  cerFiles.add("www/certificates/" + files[i]);
                }
              }
            }

            for (int i = 0; i < cerFiles.size(); i++) {
                InputStream in = cordova.getActivity().getAssets().open(cerFiles.get(i));
                InputStream caInput = new BufferedInputStream(in);
                HttpRequest.addCert(caInput);
            }
            CordovaHttp.enableSSLPinning(true);
        } else {
            CordovaHttp.enableSSLPinning(false);
        }
    }

    private HashMap<String, String> addToMap(HashMap<String, String> map, JSONObject object) throws JSONException {
        HashMap<String, String> newMap = (HashMap<String, String>)map.clone();
        Iterator<?> i = object.keys();

        while (i.hasNext()) {
            String key = (String)i.next();
            newMap.put(key, object.getString(key));
        }
        return newMap;
    }

    private HashMap<String, Object> getMapFromJSONObject(JSONObject object) throws JSONException {
        HashMap<String, Object> map = new HashMap<String, Object>();
        Iterator<?> i = object.keys();

        while(i.hasNext()) {
            String key = (String)i.next();
            map.put(key, object.get(key));
        }
        return map;
    }
}
