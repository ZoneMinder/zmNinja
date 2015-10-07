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

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.eclipse.jetty.websocket.WebSocket.Connection;
import org.eclipse.jetty.websocket.WebSocketClientFactory;

import android.util.SparseArray;

/**
 * Cordova WebSocket Plugin for Android
 * This plugin is using Jetty under the terms of the Apache License v2.0.
 *
 * @author KNOWLEDGECODE <knowledgecode@gmail.com>
 * @version 0.11.0
 */
public class WebSocket extends CordovaPlugin {

    static final String CREATE_TASK = "create";
    static final String SEND_TASK = "send";
    static final String CLOSE_TASK = "close";
    static final String RESET_TASK = "reset";
    static final String DESTROY_TASK = "destroy";

    private WebSocketClientFactory _factory;
    private SparseArray<Connection> _conn;
    private ExecutorService _executor;
    private TaskRunner _runner;

    @Override
    public void initialize(CordovaInterface cordova, final CordovaWebView webView) {
        super.initialize(cordova, webView);
        _factory = new WebSocketClientFactory();
        _conn = new SparseArray<Connection>();
        _executor = Executors.newSingleThreadExecutor();
        _runner = new TaskRunner();
        _runner.setTask(CREATE_TASK, new ConnectionTask(_factory, _conn));
        _runner.setTask(SEND_TASK, new SendingTask(_conn));
        _runner.setTask(CLOSE_TASK, new DisconnectionTask(_conn));
        _runner.setTask(RESET_TASK, new ResetTask(_conn));
        _runner.setTask(DESTROY_TASK, new DestroyTask(_factory, _conn));
        _executor.execute(_runner);
    }

    @Override
    public boolean execute(String action, String rawArgs, CallbackContext ctx) {
        return _runner.addTaskQueue(new TaskBean(action, rawArgs, ctx));
    };

    @Override
    public void onReset() {
        _runner.addTaskQueue(new TaskBean(RESET_TASK));
        super.onReset();
    }

    @Override
    public void onDestroy() {
        _runner.addTaskQueue(new TaskBean(DESTROY_TASK));
        _executor.shutdown();
        try {
            _executor.awaitTermination(Long.MAX_VALUE, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
        }
        super.onDestroy();
    }
}
