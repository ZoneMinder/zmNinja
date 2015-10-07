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
import org.eclipse.jetty.websocket.WebSocket.Connection;

import com.knowledgecode.cordova.websocket.TaskRunner.Task;

import android.util.Base64;
import android.util.SparseArray;

/**
 * Send text/binary data.
 */
class SendingTask implements Task {

    private final SparseArray<Connection> _map;

    /**
     * Constructor
     *
     * @param map
     */
    public SendingTask(SparseArray<Connection> map) {
        _map = map;
    }

    @Override
    public void execute(String rawArgs, CallbackContext ctx) {
        try {
            Connection conn = _map.get(Integer.parseInt(rawArgs.substring(2, 10), 16));

            if (conn != null) {
                if (rawArgs.charAt(10) == '1') {
                    byte[] binary = Base64.decode(rawArgs.substring(rawArgs.indexOf(',') + 1, rawArgs.length() - 2),
                            Base64.NO_WRAP);
                    conn.sendMessage(binary, 0, binary.length);
                } else {
                    conn.sendMessage(rawArgs.substring(11, rawArgs.length() - 2));
                }
            }
        } catch (Exception e) {
            if (!ctx.isFinished()) {
                PluginResult result = new PluginResult(Status.ERROR);
                result.setKeepCallback(true);
                ctx.sendPluginResult(result);
            }
        }
    }
}
