/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package com.knowledgecode.cordova.websocket;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.eclipse.jetty.websocket.PerMessageDeflateExtension;
import org.eclipse.jetty.websocket.WebSocket.Connection;
import org.eclipse.jetty.websocket.WebSocketClient;
import org.eclipse.jetty.websocket.WebSocketClientFactory;
import org.json.JSONArray;
import org.json.JSONObject;

import com.knowledgecode.cordova.websocket.TaskRunner.Task;
import com.knowledgecode.cordova.websocket.WebSocketGenerator.OnCloseListener;
import com.knowledgecode.cordova.websocket.WebSocketGenerator.OnOpenListener;

import android.util.SparseArray;
import android.webkit.CookieManager;

/**
 * Connect to server.
 */
class ConnectionTask implements Task {

    private static final long MAX_CONNECT_TIME = 75000;
    private static final int MAX_TEXT_MESSAGE_SIZE = -1;
    private static final int MAX_BINARY_MESSAGE_SIZE = -1;

    private final WebSocketClientFactory _factory;
    private final SparseArray<Connection> _map;

    /**
     * Constructor
     *
     * @param factory
     * @param map
     */
    public ConnectionTask(WebSocketClientFactory factory, SparseArray<Connection> map) {
        _factory = factory;
        _map = map;

        if (!_factory.isRunning()) {
            try {
                _factory.start();
            } catch (Exception e) {
            }
        }
    }

    /**
     * Set cookies, if any.
     *
     * @param cookies
     * @param url
     */
    private static void setCookie(Map<String, String> cookies, String url) {
        String cookie = CookieManager.getInstance().getCookie(url);

        if (cookie != null) {
            for (String c : cookie.split(";")) {
                String[] pair = c.split("=");

                if (pair.length == 2) {
                    cookies.put(pair[0], pair[1]);
                }
            }
        }
    }

    @Override
    public void execute(String rawArgs, CallbackContext ctx) {
        try {
            WebSocketClient client = _factory.newWebSocketClient();

            JSONArray args = new JSONArray(rawArgs);
            int id = Integer.parseInt(args.getString(0), 16);
            URI uri = new URI(args.getString(1));
            String protocol = args.getString(2);
            JSONObject options = args.getJSONObject(5);
            String origin = options.optString("origin", args.getString(3));
            String agent = options.optString("agent", args.getString(4));
            boolean deflate = options.optBoolean("perMessageDeflate", true);
            long maxConnectTime = options.optLong("maxConnectTime", MAX_CONNECT_TIME);

            client.setMaxTextMessageSize(options.optInt("maxTextMessageSize", MAX_TEXT_MESSAGE_SIZE));
            client.setMaxBinaryMessageSize(options.optInt("maxBinaryMessageSize", MAX_BINARY_MESSAGE_SIZE));
            if (protocol.length() > 0) {
                client.setProtocol(protocol);
            }
            if (origin.length() > 0) {
                client.setOrigin(origin);
            }
            if (agent.length() > 0) {
                client.setAgent(agent);
            }
            if (deflate) {
                client.getExtensions().add(new PerMessageDeflateExtension());
            }

            setCookie(client.getCookies(), uri.getHost());

            WebSocketGenerator gen = new WebSocketGenerator(id, ctx);

            gen.setOnOpenListener(new OnOpenListener() {
                @Override
                public void onOpen(int id, Connection conn) {
                    _map.put(id, conn);
                }
            });
            gen.setOnCloseListener(new OnCloseListener() {
                @Override
                public void onClose(int id) {
                    if (_map.indexOfKey(id) >= 0) {
                        _map.remove(id);
                    }
                }
            });
            client.open(uri, gen, maxConnectTime, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            if (!ctx.isFinished()) {
                PluginResult result = new PluginResult(Status.ERROR);
                result.setKeepCallback(true);
                ctx.sendPluginResult(result);
            }
        }
    }
}

