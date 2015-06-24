/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import java.io.File;
import java.net.UnknownHostException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.cordova.CallbackContext;
import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.SSLHandshakeException;

import android.util.Log;
import android.webkit.MimeTypeMap;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

public class CordovaHttpUpload extends CordovaHttp implements Runnable {
    private String filePath;
    private String name;

    public CordovaHttpUpload(String urlString, Map<?, ?> params, Map<String, String> headers, CallbackContext callbackContext, String filePath, String name) {
        super(urlString, params, headers, callbackContext);
        this.filePath = filePath;
        this.name = name;
    }

    @Override
    public void run() {
        try {
            HttpRequest request = HttpRequest.post(this.getUrlString());
            this.setupSecurity(request);
            request.acceptCharset(CHARSET);
            request.headers(this.getHeaders());
            URI uri = new URI(filePath);
            int index = filePath.lastIndexOf('/');
            String filename = filePath.substring(index + 1);
            index = filePath.lastIndexOf('.');
            String ext = filePath.substring(index + 1);
            MimeTypeMap mimeTypeMap = MimeTypeMap.getSingleton();
            String mimeType = mimeTypeMap.getMimeTypeFromExtension(ext);
            request.part(this.name, filename, mimeType, new File(uri));

            Set<?> set = (Set<?>)this.getParams().entrySet();
            Iterator<?> i = set.iterator();
            while (i.hasNext()) {
                Entry<?, ?> e = (Entry<?, ?>)i.next();
                String key = (String)e.getKey();
                Object value = e.getValue();
                if (value instanceof Number) {
                    request.part(key, (Number)value);
                } else if (value instanceof String) {
                    request.part(key, (String)value);
                } else {
                    this.respondWithError("All parameters must be Numbers or Strings");
                    return;
                }
            }

            int code = request.code();
            String body = request.body(CHARSET);

            JSONObject response = new JSONObject();
            response.put("status", code);
            if (code >= 200 && code < 300) {
                response.put("data", body);
                this.getCallbackContext().success(response);
            } else {
                response.put("error", body);
                this.getCallbackContext().error(response);
            }
        } catch (URISyntaxException e) {
            this.respondWithError("There was an error loading the file");
        } catch (JSONException e) {
            this.respondWithError("There was an error generating the response");
        }  catch (HttpRequestException e) {
            if (e.getCause() instanceof UnknownHostException) {
                this.respondWithError(0, "The host could not be resolved");
            } else if (e.getCause() instanceof SSLHandshakeException) {
                this.respondWithError("SSL handshake failed");
            } else {
                this.respondWithError("There was an error with the request");
            }
        }
    }
}
