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
package org.eclipse.jetty.websocket;

import java.nio.charset.Charset;
import java.util.Arrays;

import org.eclipse.jetty.io.Buffer;

/**
 * WebSocketBuffer
 *
 * Copyright (c) 2015 KNOWLEDGECODE
 */
class WebSocketBuffer implements Buffer {

    private byte[] _buffer;
    private int _index;
    private int _capacity;

    public WebSocketBuffer(final int capacity) {
        _buffer = new byte[capacity];
        _index = 0;
        _capacity = capacity;
    }

    public WebSocketBuffer(final byte[] buffer, final int offset, final int length) {
        _buffer = Arrays.copyOfRange(buffer, offset, length);
        _index = length;
        _capacity = length;
    }

    public WebSocketBuffer append(final byte[] array, final int offset, final int length) {
        if ((_index += length) > _capacity) {
            _buffer = Arrays.copyOf(_buffer, (_capacity = Math.max(_capacity << 1, _index)));
        }
        System.arraycopy(array, offset, _buffer, _index - length, length);
        return this;
    }

    @Override
    public byte[] array() {
        return _buffer;
    }

    @Override
    public byte[] asArray() {
        return Arrays.copyOf(_buffer, _index);
    }

    @Override
    public Buffer buffer() {
        return null;
    }

    @Override
    public Buffer asMutableBuffer() {
        return null;
    }

    @Override
    public int capacity() {
        return _capacity;
    }

    @Override
    public int space() {
        return _capacity - _index;
    }

    @Override
    public void clear() {
        _index = 0;
    }

    @Override
    public void compact() {
    }

    @Override
    public byte get() {
        return 0;
    }

    @Override
    public int get(byte[] b, int offset, int length) {
        return 0;
    }

    @Override
    public Buffer get(int length) {
        return null;
    }

    @Override
    public int getIndex() {
        return 0;
    }

    @Override
    public boolean hasContent() {
        return false;
    }

    @Override
    public boolean equalsIgnoreCase(Buffer buffer) {
        return false;
    }

    @Override
    public boolean isImmutable() {
        return false;
    }

    @Override
    public boolean isReadOnly() {
        return false;
    }

    @Override
    public boolean isVolatile() {
        return false;
    }

    @Override
    public int length() {
        return _index;
    }

    @Override
    public void mark() {
    }

    @Override
    public int markIndex() {
        return 0;
    }

    @Override
    public byte peek() {
        return 0;
    }

    @Override
    public byte peek(int index) {
        return 0;
    }

    @Override
    public int peek(int index, byte[] b, int offset, int length) {
        return 0;
    }

    @Override
    public int poke(int index, Buffer src) {
        return 0;
    }

    @Override
    public void poke(int index, byte b) {
    }

    @Override
    public int poke(int index, byte[] b, int offset, int length) {
        return 0;
    }

    @Override
    public int put(Buffer src) {
        return 0;
    }

    @Override
    public void put(byte b) {
    }

    @Override
    public int put(byte[] b, int offset, int length) {
        return 0;
    }

    @Override
    public int put(byte[] b) {
        return 0;
    }

    @Override
    public int putIndex() {
        return 0;
    }

    @Override
    public void setGetIndex(int newStart) {
    }

    @Override
    public void setMarkIndex(int newMark) {
    }

    @Override
    public void setPutIndex(int newLimit) {
    }

    @Override
    public int skip(int n) {
        return n;
    }

    @Override
    public Buffer sliceFromMark() {
        return null;
    }

    @Override
    public Buffer sliceFromMark(int length) {
        return null;
    }

    @Override
    public String toDetailString() {
        return null;
    }

    @Override
    public String toString(Charset charset) {
        return new String(_buffer, 0, _index, charset);
    }
}
