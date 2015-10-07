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

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;

import android.util.Base64;

class WebSocketGenerator implements
    org.eclipse.jetty.websocket.WebSocket.OnTextMessage,
    org.eclipse.jetty.websocket.WebSocket.OnBinaryMessage {

    interface OnOpenListener {
        public void onOpen(int id, Connection conn);
    }

    interface OnCloseListener {
        public void onClose(int id);
    }

    private final int _id;
    private final CallbackContext _ctx;
    private OnOpenListener _openListener;
    private OnCloseListener _closeListener;

    /**
     * Constructor
     *
     * @param id
     * @param ctx
     */
    public WebSocketGenerator(int id, CallbackContext ctx) {
        _id = id;
        _ctx = ctx;
        _openListener = new OnOpenListener() {
            @Override
            public void onOpen(int id, Connection conn) {
                // NOP
            }
        };
        _closeListener = new OnCloseListener() {
            @Override
            public void onClose(int id) {
                // NOP
            }
        };
    }

    /**
     * Set OnOpen listener.
     *
     * @param l
     */
    public void setOnOpenListener(OnOpenListener l) {
        _openListener = l;
    }

    /**
     * Set OnClose listener.
     *
     * @param l
     */
    public void setOnCloseListener(OnCloseListener l) {
        _closeListener = l;
    }

    @Override
    public void onOpen(Connection conn) {
        _openListener.onOpen(_id, conn);

        String protocol = conn.getProtocol();
        String extensions = conn.getExtensions();
        protocol = protocol == null ? "" : protocol;
        extensions = extensions == null ? "" : extensions;
        sendCallback(String.format("O[\"%s\",\"%s\"]", protocol, extensions), true);
    }

    @Override
    public void onMessage(String data) {
        sendCallback("T" + data, true);
    }

    @Override
    public void onMessage(byte[] data, int offset, int length) {
        sendCallback("B" + Base64.encodeToString(data, offset, length, Base64.NO_WRAP), true);
    }

    @Override
    public void onClose(int code, String reason) {
        _closeListener.onClose(_id);

        String wasClean = code == 1000 ? "1" : "0";
        reason = reason == null ? "" : reason;
        sendCallback(String.format("C%s%4d%s", wasClean, code, reason), false);
    }

    /**
     * Send plugin result.
     *
     * @param callbackString
     * @param keepCallback
     */
    private void sendCallback(String callbackString, boolean keepCallback) {
        if (!_ctx.isFinished()) {
            PluginResult result = new PluginResult(Status.OK, callbackString);
            result.setKeepCallback(keepCallback);
            _ctx.sendPluginResult(result);
        }
    }
}
