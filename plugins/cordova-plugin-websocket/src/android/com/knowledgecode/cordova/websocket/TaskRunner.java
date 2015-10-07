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

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.apache.cordova.CallbackContext;

class TaskRunner implements Runnable {

    interface Task {
        public void execute(String rawArgs, CallbackContext ctx);
    }

    private BlockingQueue<TaskBean> _queue;
    private Map<String, Task> _map;

    public TaskRunner() {
        _queue = new LinkedBlockingQueue<TaskBean>();
        _map = new HashMap<String, Task>();
    }

    public void setTask(String action, Task task) {
        _map.put(action, task);
    }

    public boolean addTaskQueue(TaskBean bean) {
        try {
            _queue.put(bean);
        } catch (InterruptedException e) {
            return false;
        }
        return true;
    }

    @Override
    public void run() {
        while (true) {
            TaskBean task;

            try {
                task = _queue.take();
            } catch (InterruptedException e) {
                break;
            }
            String action = task.getAction();

            _map.get(action).execute(task.getRawArgs(), task.getCtx());
            if (WebSocket.DESTROY_TASK.equals(action)) {
                break;
            }
        }
        _queue.clear();
        _map.clear();
    }
}
