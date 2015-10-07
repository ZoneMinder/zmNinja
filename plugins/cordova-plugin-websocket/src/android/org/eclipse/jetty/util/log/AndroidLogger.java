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
package org.eclipse.jetty.util.log;

/**
 * Logger for Android
 *
 * Copyright (c) 2015 KNOWLEDGECODE
 */
class AndroidLogger implements Logger {

    private String _tag;

    AndroidLogger() {
    }

    private AndroidLogger(String tag) {
        _tag = tag.substring(tag.length() > 23 ? tag.length() - 23 : 0);
    }

    private static String format(String msg, Object... args) {
        return String.format(msg.replaceAll("\\{\\}", "%s"), args);
    }

    @Override
    public String getName() {
        return AndroidLogger.class.getName();
    }

    @Override
    public void warn(String msg, Object... args) {
        android.util.Log.w(_tag, format(msg, args));
    }

    @Override
    public void warn(Throwable thrown) {
        android.util.Log.w(_tag, thrown);
    }

    @Override
    public void warn(String msg, Throwable thrown) {
        android.util.Log.w(_tag, msg, thrown);
    }

    @Override
    public void info(String msg, Object... args) {
        android.util.Log.i(_tag, format(msg, args));
    }

    @Override
    public void info(Throwable thrown) {
        android.util.Log.i(_tag, "", thrown);
    }

    @Override
    public void info(String msg, Throwable thrown) {
        android.util.Log.i(_tag, msg, thrown);
    }

    @Override
    public boolean isDebugEnabled() {
        return android.util.Log.isLoggable(_tag, android.util.Log.DEBUG);
    }

    @Override
    public void setDebugEnabled(boolean enabled) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void debug(String msg, Object... args) {
        android.util.Log.d(_tag, format(msg, args));
    }

    @Override
    public void debug(Throwable thrown) {
        android.util.Log.d(_tag, "", thrown);
    }

    @Override
    public void debug(String msg, Throwable thrown) {
        android.util.Log.d(_tag, msg, thrown);
    }

    @Override
    public Logger getLogger(String tag) {
        return new AndroidLogger(tag);
    }

    @Override
    public void ignore(Throwable ignored) {
        // ignore
    }
}
