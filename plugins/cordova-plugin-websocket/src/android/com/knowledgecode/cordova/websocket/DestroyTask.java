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
import org.eclipse.jetty.websocket.WebSocket.Connection;
import org.eclipse.jetty.websocket.WebSocketClientFactory;

import com.knowledgecode.cordova.websocket.TaskRunner.Task;

import android.util.SparseArray;

/**
 * Stop WebSocket client.
 */
class DestroyTask implements Task {

    private final WebSocketClientFactory _factory;
    private final SparseArray<Connection> _map;

    /**
     * Constructor
     *
     * @param factory
     * @param map
     */
    public DestroyTask(WebSocketClientFactory factory, SparseArray<Connection> map) {
        _factory = factory;
        _map = map;
    }

    @Override
    public void execute(String rawArgs, CallbackContext ctx) {
        for (int i = 0; i < _map.size(); i++) {
            int key = _map.keyAt(i);

            if (_map.get(key).isOpen()) {
                _map.get(key).close();
            }
        }
        _map.clear();

        if (_factory.isRunning()) {
            try {
                _factory.stop();
            } catch (Exception e) {
            }
        }
    }
}
