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
import org.json.JSONArray;

import com.knowledgecode.cordova.websocket.TaskRunner.Task;

import android.util.SparseArray;

/**
 * Close a connection.
 */
class DisconnectionTask implements Task {

    private final SparseArray<Connection> _map;

    /**
     * Constructor
     *
     * @param map
     */
    public DisconnectionTask(SparseArray<Connection> map) {
        _map = map;
    }

    @Override
    public void execute(String rawArgs, CallbackContext ctx) {
        try {
            JSONArray args = new JSONArray(rawArgs);
            int id = Integer.parseInt(args.getString(0), 16);
            int code = args.getInt(1);
            String reason = args.getString(2);
            Connection conn = _map.get(id);

            if (conn != null) {
                if (code > 0) {
                    conn.close(code, reason);
                } else {
                    conn.close();
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
