//
//  ========================================================================
//  Copyright (c) 1995-2015 Mort Bay Consulting Pty. Ltd.
//  ------------------------------------------------------------------------
//  All rights reserved. This program and the accompanying materials
//  are made available under the terms of the Eclipse Public License v1.0
//  and Apache License v2.0 which accompanies this distribution.
//
//      The Eclipse Public License is available at
//      http://www.eclipse.org/legal/epl-v10.html
//
//      The Apache License v2.0 is available at
//      http://www.opensource.org/licenses/apache2.0.php
//
//  You may select to redistribute this code under either of these licenses.
//  ========================================================================
//

package org.eclipse.jetty.websocket;

import java.io.IOException;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.eclipse.jetty.io.AbstractConnection;
import org.eclipse.jetty.io.AsyncEndPoint;
import org.eclipse.jetty.io.Buffer;
import org.eclipse.jetty.io.Connection;
import org.eclipse.jetty.io.EndPoint;
import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;
import org.eclipse.jetty.websocket.WebSocket.OnBinaryMessage;
import org.eclipse.jetty.websocket.WebSocket.OnControl;
import org.eclipse.jetty.websocket.WebSocket.OnFrame;
import org.eclipse.jetty.websocket.WebSocket.OnTextMessage;

import android.text.TextUtils;
import android.util.Base64;

/* ------------------------------------------------------------ */
/**
 * <pre>
 *    0                   1                   2                   3
 *    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *   +-+-+-+-+-------+-+-------------+-------------------------------+
 *   |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 *   |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 *   |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 *   | |1|2|3|       |K|             |                               |
 *   +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 *   |     Extended payload length continued, if payload len == 127  |
 *   + - - - - - - - - - - - - - - - +-------------------------------+
 *   |                               |Masking-key, if MASK set to 1  |
 *   +-------------------------------+-------------------------------+
 *   | Masking-key (continued)       |          Payload Data         |
 *   +-------------------------------- - - - - - - - - - - - - - - - +
 *   :                     Payload Data continued ...                :
 *   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 *   |                     Payload Data continued ...                |
 *   +---------------------------------------------------------------+
 * </pre>
 *
 * modified by KNOWLEDGECODE
 */
public class WebSocketConnectionRFC6455 extends AbstractConnection implements WebSocketConnection
{
    private static final Logger LOG = Log.getLogger(WebSocketConnectionRFC6455.class);

    final static byte OP_CONTINUATION = 0x00;
    final static byte OP_TEXT = 0x01;
    final static byte OP_BINARY = 0x02;
    final static byte OP_EXT_DATA = 0x03;

    final static byte OP_CONTROL = 0x08;
    final static byte OP_CLOSE = 0x08;
    final static byte OP_PING = 0x09;
    final static byte OP_PONG = 0x0A;
    final static byte OP_EXT_CTRL = 0x0B;

    final static int CLOSE_NORMAL=1000;
    final static int CLOSE_SHUTDOWN=1001;
    final static int CLOSE_PROTOCOL=1002;
    final static int CLOSE_BAD_DATA=1003;
    final static int CLOSE_UNDEFINED=1004;
    final static int CLOSE_NO_CODE=1005;
    final static int CLOSE_NO_CLOSE=1006;
    final static int CLOSE_BAD_PAYLOAD=1007;
    final static int CLOSE_POLICY_VIOLATION=1008;
    final static int CLOSE_MESSAGE_TOO_LARGE=1009;
    final static int CLOSE_REQUIRED_EXTENSION=1010;
    final static int CLOSE_SERVER_ERROR=1011;
    final static int CLOSE_FAILED_TLS_HANDSHAKE=1015;

    final static int FLAG_FIN=0x8;

    // Per RFC 6455, section 1.3 - Opening Handshake - this version is "13"
    final static int VERSION=13;

    static boolean isLastFrame(byte flags)
    {
        return (flags&FLAG_FIN)!=0;
    }

    static boolean isControlFrame(byte opcode)
    {
        return (opcode&OP_CONTROL)!=0;
    }

    private final static byte[] MAGIC;
    private final List<Extension> _extensions;
    private final WebSocketParserRFC6455 _parser;
    private final WebSocketGeneratorRFC6455 _generator;
    private final WebSocketGenerator _outbound;
    private final WebSocket _webSocket;
    private final OnFrame _onFrame;
    private final OnBinaryMessage _onBinaryMessage;
    private final OnTextMessage _onTextMessage;
    private final OnControl _onControl;
    private final String _protocol;
    private final ClassLoader _context;
    private volatile int _closeCode;
    private volatile String _closeMessage;
    private volatile boolean _closedIn;
    private volatile boolean _closedOut;
    private int _maxTextMessageSize=-1;
    private int _maxBinaryMessageSize=-1;

    private static final Charset _iso88591 = Charset.forName("ISO-8859-1");
    private static final Charset _utf8 = Charset.forName("UTF-8");

    static
    {
        MAGIC="258EAFA5-E914-47DA-95CA-C5AB0DC85B11".getBytes(_iso88591);
    }

    private final WebSocket.FrameConnection _connection = new WSFrameConnection();

    /* ------------------------------------------------------------ */
    public WebSocketConnectionRFC6455(WebSocket websocket, EndPoint endpoint, WebSocketBuffers buffers, long timestamp, int maxIdleTime, String protocol, List<Extension> extensions,int draft, MaskGen maskgen)
        throws IOException
    {
        super(endpoint,timestamp);

        _context=Thread.currentThread().getContextClassLoader();

        _endp.setMaxIdleTime(maxIdleTime);

        _webSocket = websocket;
        _onFrame=_webSocket instanceof OnFrame ? (OnFrame)_webSocket : null;
        _onTextMessage=_webSocket instanceof OnTextMessage ? (OnTextMessage)_webSocket : null;
        _onBinaryMessage=_webSocket instanceof OnBinaryMessage ? (OnBinaryMessage)_webSocket : null;
        _onControl=_webSocket instanceof OnControl ? (OnControl)_webSocket : null;
        _generator = new WebSocketGeneratorRFC6455(buffers, _endp,maskgen);

        _extensions=extensions;
        WebSocketParser.FrameHandler frameHandler = new WSFrameHandler();
        if (_extensions!=null)
        {
            int e=0;
            for (Extension extension : _extensions)
            {
                extension.bind(
                        _connection,
                        e==extensions.size()-1? frameHandler :extensions.get(e+1),
                        e==0?_generator:extensions.get(e-1));
                e++;
            }
        }

        _outbound=(_extensions==null||_extensions.size()==0)?_generator:extensions.get(extensions.size()-1);
        WebSocketParser.FrameHandler inbound = (_extensions == null || _extensions.size() == 0) ? frameHandler : extensions.get(0);

        _parser = new WebSocketParserRFC6455(buffers, endpoint, inbound,maskgen==null);

        _protocol=protocol;

    }

    /* ------------------------------------------------------------ */
    public WebSocket.Connection getConnection()
    {
        return _connection;
    }

    /* ------------------------------------------------------------ */
    public List<Extension> getExtensions()
    {
        if (_extensions==null)
            return Collections.emptyList();

        return _extensions;
    }

    /* ------------------------------------------------------------ */
    public Connection handle() throws IOException
    {
        Thread current = Thread.currentThread();
        ClassLoader oldcontext = current.getContextClassLoader();
        current.setContextClassLoader(_context);
        try
        {
            // handle the framing protocol
            boolean progress=true;

            while (progress)
            {
                int flushed=_generator.flushBuffer();
                int filled=_parser.parseNext();

                progress = flushed>0 || filled>0;
                _endp.flush();

                if (_endp instanceof AsyncEndPoint && ((AsyncEndPoint)_endp).hasProgressed())
                    progress=true;
            }
        }
        catch(IOException e)
        {
            try
            {
                if (_endp.isOpen())
                    _endp.close();
            }
            catch(IOException e2)
            {
                LOG.ignore(e2);
            }
            throw e;
        }
        finally
        {
            current.setContextClassLoader(oldcontext);
            _parser.returnBuffer();
            _generator.returnBuffer();
            if (_endp.isOpen())
            {
                if (_closedIn && _closedOut && _outbound.isBufferEmpty())
                    _endp.close();
                else if (_endp.isInputShutdown() && !_closedIn)
                    closeIn(CLOSE_NO_CLOSE,null);
                else
                    checkWriteable();
            }
        }
        return this;
    }

    /* ------------------------------------------------------------ */
    public void onInputShutdown() throws IOException
    {
        if (!_closedIn)
            _endp.close();
    }

    /* ------------------------------------------------------------ */
    public boolean isIdle()
    {
        return _parser.isBufferEmpty() && _outbound.isBufferEmpty();
    }

    /* ------------------------------------------------------------ */
    @Override
    public void onIdleExpired(long idleForMs)
    {
        closeOut(WebSocketConnectionRFC6455.CLOSE_NORMAL,"Idle for "+idleForMs+"ms > "+_endp.getMaxIdleTime()+"ms");
    }

    /* ------------------------------------------------------------ */
    public boolean isSuspended()
    {
        return false;
    }

    /* ------------------------------------------------------------ */
    public void onClose()
    {
        final boolean closed;
        synchronized (this)
        {
            closed=_closeCode==0;
            if (closed)
                _closeCode=WebSocketConnectionRFC6455.CLOSE_NO_CLOSE;
        }
        if (closed)
            _webSocket.onClose(WebSocketConnectionRFC6455.CLOSE_NO_CLOSE,"closed");
    }

    /* ------------------------------------------------------------ */
    public void closeIn(int code,String message)
    {
        LOG.debug("ClosedIn {} {} {}",this,code,message);

        final boolean closed_out;
        final boolean tell_app;
        synchronized (this)
        {
            closed_out=_closedOut;
            _closedIn=true;
            tell_app=_closeCode==0;
            if (tell_app)
            {
                _closeCode=code;
                _closeMessage=message;
            }
        }

        try
        {
            if (!closed_out)
                closeOut(code,message);
        }
        finally
        {
            if  (tell_app)
                _webSocket.onClose(code,message);
        }
    }

    /* ------------------------------------------------------------ */
    public void closeOut(int code,String message)
    {
        LOG.debug("ClosedOut {} {} {}",this,code,message);

        final boolean closed_out;
        final boolean tell_app;
        synchronized (this)
        {
            closed_out=_closedOut;
            _closedOut=true;
            tell_app=_closeCode==0;
            if (tell_app)
            {
                _closeCode=code;
                _closeMessage=message;
            }
        }

        try
        {
            if (tell_app)
                _webSocket.onClose(code,message);
        }
        finally
        {
            try
            {
                if (!closed_out)
                {
                    // Close code 1005/1006/1015 are never to be sent as a status over
                    // a Close control frame. Code<-1 also means no node.

                    if (code < 0 || (code == WebSocketConnectionRFC6455.CLOSE_NO_CODE) || (code == WebSocketConnectionRFC6455.CLOSE_NO_CLOSE)
                            || (code == WebSocketConnectionRFC6455.CLOSE_FAILED_TLS_HANDSHAKE))
                    {
                        code = -1;
                    }
                    else if (code == 0)
                    {
                        code = WebSocketConnectionRFC6455.CLOSE_NORMAL;
                    }

                    byte[] bytes = ("xx"+(message==null?"":message)).getBytes(_iso88591);
                    bytes[0]=(byte)(code/0x100);
                    bytes[1]=(byte)(code%0x100);
                    _outbound.addFrame((byte)FLAG_FIN,WebSocketConnectionRFC6455.OP_CLOSE,bytes,0,code>0?bytes.length:0);
                    _outbound.flush();
                }
            }
            catch(IOException e)
            {
                LOG.ignore(e);
            }
        }
    }

    public void shutdown()
    {
        final WebSocket.Connection connection = _connection;
        if (connection != null)
            connection.close(CLOSE_SHUTDOWN, null);
    }

    /* ------------------------------------------------------------ */
    public void fillBuffersFrom(Buffer buffer)
    {
        _parser.fill(buffer);
    }

    /* ------------------------------------------------------------ */
    private void checkWriteable()
    {
        if (!_outbound.isBufferEmpty() && _endp instanceof AsyncEndPoint)
        {
            ((AsyncEndPoint)_endp).scheduleWrite();
        }
    }

    protected void onFrameHandshake()
    {
        if (_onFrame != null)
        {
            _onFrame.onHandshake(_connection);
        }
    }

    protected void onWebSocketOpen()
    {
        _webSocket.onOpen(_connection);
    }

    /* ------------------------------------------------------------ */
    private class WSFrameConnection implements WebSocket.FrameConnection
    {
        private volatile boolean _disconnecting;

        /* ------------------------------------------------------------ */
        public void sendMessage(String content) throws IOException
        {
            if (_closedOut)
                throw new IOException("closedOut " + _closeCode + ":" + _closeMessage);
            byte[] data = content.getBytes(_utf8);
            _outbound.addFrame((byte)FLAG_FIN, WebSocketConnectionRFC6455.OP_TEXT, data, 0, data.length);
            checkWriteable();
        }

        /* ------------------------------------------------------------ */
        public void sendMessage(byte[] content, int offset, int length) throws IOException
        {
            if (_closedOut)
                throw new IOException("closedOut " + _closeCode + ":" + _closeMessage);
            _outbound.addFrame((byte)FLAG_FIN, WebSocketConnectionRFC6455.OP_BINARY, content, offset, length);
            checkWriteable();
        }

        /* ------------------------------------------------------------ */
        public void sendFrame(byte flags,byte opcode, byte[] content, int offset, int length) throws IOException
        {
            if (_closedOut)
                throw new IOException("closedOut " + _closeCode + ":" + _closeMessage);
            _outbound.addFrame(flags, opcode, content, offset, length);
            checkWriteable();
        }

        /* ------------------------------------------------------------ */
        public void sendControl(byte ctrl, byte[] data, int offset, int length) throws IOException
        {
            // TODO: section 5.5 states that control frames MUST never be length > 125 bytes and MUST NOT be fragmented
            if (_closedOut)
                throw new IOException("closedOut " + _closeCode + ":" + _closeMessage);
            _outbound.addFrame((byte)FLAG_FIN, ctrl, data, offset, length);
            checkWriteable();
        }

        /* ------------------------------------------------------------ */
        public boolean isMessageComplete(byte flags)
        {
            return isLastFrame(flags);
        }

        /* ------------------------------------------------------------ */
        public boolean isOpen()
        {
            return _endp!=null&&_endp.isOpen();
        }

        /* ------------------------------------------------------------ */
        public void close(int code, String message)
        {
            if (_disconnecting)
                return;
            _disconnecting=true;
            WebSocketConnectionRFC6455.this.closeOut(code,message);
        }

        /* ------------------------------------------------------------ */
        public void setMaxIdleTime(int ms)
        {
            try
            {
                _endp.setMaxIdleTime(ms);
            }
            catch(IOException e)
            {
                LOG.warn(e);
            }
        }

        /* ------------------------------------------------------------ */
        public void setMaxTextMessageSize(int size)
        {
            _maxTextMessageSize=size;
        }

        /* ------------------------------------------------------------ */
        public void setMaxBinaryMessageSize(int size)
        {
            _maxBinaryMessageSize=size;
        }

        /* ------------------------------------------------------------ */
        public int getMaxIdleTime()
        {
            return _endp.getMaxIdleTime();
        }

        /* ------------------------------------------------------------ */
        public int getMaxTextMessageSize()
        {
            return _maxTextMessageSize;
        }

        /* ------------------------------------------------------------ */
        public int getMaxBinaryMessageSize()
        {
            return _maxBinaryMessageSize;
        }

        /* ------------------------------------------------------------ */
        public String getProtocol()
        {
            return _protocol;
        }

        /* ------------------------------------------------------------ */
        public String getExtensions()
        {
            List<String> extensions = new ArrayList<String>();

            for (Extension extension : _extensions)
            {
                extensions.add(extension.getParameterizedName());
            }
            return TextUtils.join(", ", extensions);
        }

        /* ------------------------------------------------------------ */
        public byte binaryOpcode()
        {
            return OP_BINARY;
        }

        /* ------------------------------------------------------------ */
        public byte textOpcode()
        {
            return OP_TEXT;
        }

        /* ------------------------------------------------------------ */
        public byte continuationOpcode()
        {
            return OP_CONTINUATION;
        }

        /* ------------------------------------------------------------ */
        public byte finMask()
        {
            return FLAG_FIN;
        }

        /* ------------------------------------------------------------ */
        public boolean isControl(byte opcode)
        {
            return isControlFrame(opcode);
        }

        /* ------------------------------------------------------------ */
        public boolean isText(byte opcode)
        {
            return opcode==OP_TEXT;
        }

        /* ------------------------------------------------------------ */
        public boolean isBinary(byte opcode)
        {
            return opcode==OP_BINARY;
        }

        /* ------------------------------------------------------------ */
        public boolean isContinuation(byte opcode)
        {
            return opcode==OP_CONTINUATION;
        }

        /* ------------------------------------------------------------ */
        public boolean isClose(byte opcode)
        {
            return opcode==OP_CLOSE;
        }

        /* ------------------------------------------------------------ */
        public boolean isPing(byte opcode)
        {
            return opcode==OP_PING;
        }

        /* ------------------------------------------------------------ */
        public boolean isPong(byte opcode)
        {
            return opcode==OP_PONG;
        }

        /* ------------------------------------------------------------ */
        public void close()
        {
            close(CLOSE_NORMAL,null);
        }

        /* ------------------------------------------------------------ */
        public void setAllowFrameFragmentation(boolean allowFragmentation)
        {
            _parser.setFakeFragments(allowFragmentation);
        }

        /* ------------------------------------------------------------ */
        public boolean isAllowFrameFragmentation()
        {
            return _parser.isFakeFragments();
        }

        /* ------------------------------------------------------------ */
        @Override
        public String toString()
        {
            return String.format(Locale.getDefault(), "%s@%x l(%s:%d)<->r(%s:%d)",
                    getClass().getSimpleName(),
                    hashCode(),
                    _endp.getLocalAddr(),
                    _endp.getLocalPort(),
                    _endp.getRemoteAddr(),
                    _endp.getRemotePort());
        }
    }

    private class WSFrameHandler implements WebSocketParser.FrameHandler
    {
        private static final int MAX_CONTROL_FRAME_PAYLOAD = 125;
        private static final int INITIAL_CAPACITY = 8192;
        private WebSocketBuffer _buffer = new WebSocketBuffer(INITIAL_CAPACITY);
        private byte _opcode = -1;

        private boolean excess(int opcode, int length)
        {
            switch (opcode)
            {
                case WebSocketConnectionRFC6455.OP_TEXT:
                    return _maxTextMessageSize > 0 && _maxTextMessageSize < length;
                case WebSocketConnectionRFC6455.OP_BINARY:
                    return _maxBinaryMessageSize > 0 && _maxBinaryMessageSize < length;
                default:
                    return false;
            }
        }

        public void onFrame(final byte flags, final byte opcode, final Buffer buffer)
        {
            synchronized (WebSocketConnectionRFC6455.this)
            {
                // Ignore incoming after a close
                if (_closedIn)
                {
                    return;
                }
            }

            byte[] array = buffer.array();
            int offset = buffer.getIndex();
            int length = buffer.length();

            if (isControlFrame(opcode) && length > MAX_CONTROL_FRAME_PAYLOAD)
            {
                errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL, "Control frame too large: " + length + " > " + MAX_CONTROL_FRAME_PAYLOAD);
                return;
            }

            if ((flags & 0x7) != 0)
            {
                errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL, "RSV bits set 0x" + Integer.toHexString(flags));
                return;
            }

            // Ignore all frames after error close
            if (_closeCode != 0 && _closeCode != CLOSE_NORMAL && opcode != OP_CLOSE)
            {
                return;
            }

            // Deliver frame if websocket is a FrameWebSocket
            if (_onFrame != null)
            {
                if (_onFrame.onFrame(flags, opcode, array, offset, length))
                {
                    return;
                }
            }

            if (_onControl != null && isControlFrame(opcode))
            {
                if (_onControl.onControl(opcode, array, offset, length))
                {
                    return;
                }
            }

            switch (opcode)
            {
                case WebSocketConnectionRFC6455.OP_TEXT:
                case WebSocketConnectionRFC6455.OP_BINARY:
                {
                    if (_opcode != -1)
                    {
                        _buffer.clear();
                        errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL, "Expected Continuation" + Integer.toHexString(opcode));
                        return;
                    }
                    _opcode = opcode;
                }
                case WebSocketConnectionRFC6455.OP_CONTINUATION:
                {
                    if (_opcode == -1)
                    {
                        _buffer.clear();
                        errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL, "Bad Continuation");
                        return;
                    }
                    if (excess(_opcode, _buffer.length() + length))
                    {
                        switch (_opcode)
                        {
                            case WebSocketConnectionRFC6455.OP_TEXT:
                                _connection.close(WebSocketConnectionRFC6455.CLOSE_MESSAGE_TOO_LARGE, "Text message size > " + _maxTextMessageSize + " chars");
                                return;
                            case WebSocketConnectionRFC6455.OP_BINARY:
                                _connection.close(WebSocketConnectionRFC6455.CLOSE_MESSAGE_TOO_LARGE, "Message size > " + _maxBinaryMessageSize);
                                return;
                        }
                    }
                    if (isLastFrame(flags))
                    {
                        switch (_opcode)
                        {
                            case WebSocketConnectionRFC6455.OP_TEXT:
                                if (_buffer.length() == 0)
                                {
                                    _onTextMessage.onMessage(new String(array, offset, length, _utf8));
                                }
                                else
                                {
                                    _onTextMessage.onMessage(_buffer.append(array, offset, length).toString(_utf8));
                                }
                                break;
                            case WebSocketConnectionRFC6455.OP_BINARY:
                                if (_buffer.length() == 0)
                                {
                                    _onBinaryMessage.onMessage(array, offset, length);
                                }
                                else
                                {
                                    _onBinaryMessage.onMessage(_buffer.append(array, offset, length).array(), 0, _buffer.length());
                                }
                                break;
                        }
                        _opcode = -1;
                        _buffer.clear();
                    }
                    else
                    {
                        _buffer.append(array, offset, length);
                    }
                    break;
                }

                case WebSocketConnectionRFC6455.OP_PING:
                {
                    LOG.debug("PING {}",this);
                    if (!_closedOut)
                    {
                        try
                        {
                            _connection.sendControl(WebSocketConnectionRFC6455.OP_PONG, array, offset, length);
                        }
                        catch (Throwable e)
                        {
                            errorClose(WebSocketConnectionRFC6455.CLOSE_SERVER_ERROR, "Internal Server Error: " + e);
                        }
                    }
                    break;
                }

                case WebSocketConnectionRFC6455.OP_PONG:
                {
                    LOG.debug("PONG {}",this);
                    break;
                }

                case WebSocketConnectionRFC6455.OP_CLOSE:
                {
                    int code = WebSocketConnectionRFC6455.CLOSE_NO_CODE;
                    String message = null;
                    if (length >= 2)
                    {
                        code=(0xff & array[offset]) * 0x100 + (0xff & array[offset + 1]);

                        // Validate close status codes.
                        if (code < WebSocketConnectionRFC6455.CLOSE_NORMAL ||
                            code == WebSocketConnectionRFC6455.CLOSE_UNDEFINED ||
                            code == WebSocketConnectionRFC6455.CLOSE_NO_CLOSE ||
                            code == WebSocketConnectionRFC6455.CLOSE_NO_CODE ||
                            ( code > 1011 && code <= 2999 ) ||
                            code >= 5000 )
                        {
                            errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL,"Invalid close code " + code);
                            return;
                        }
                    }
                    else if(buffer.length() == 1)
                    {
                        // Invalid length. use status code 1002 (Protocol error)
                        errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL,"Invalid payload length of 1");
                        return;
                    }
                    closeIn(code, message);
                    break;
                }

                default:
                    errorClose(WebSocketConnectionRFC6455.CLOSE_PROTOCOL,"Bad opcode 0x"+Integer.toHexString(opcode));
                    break;
            }
        }

        private void errorClose(int code, String message)
        {
            _connection.close(code, message);

            // Brutally drop the connection
            try
            {
                _endp.close();
            }
            catch (IOException e)
            {
                LOG.warn(e.toString());
                LOG.debug(e);
            }
        }

        public void close(int code,String message)
        {
            if (code != CLOSE_NORMAL)
                LOG.warn("Close: " + code + " " + message);
            _connection.close(code, message);
        }

        @Override
        public String toString()
        {
            return WebSocketConnectionRFC6455.this.toString() + "FH";
        }
    }

    /* ------------------------------------------------------------ */
    public static String hashKey(String key)
    {
        try
        {
            MessageDigest md = MessageDigest.getInstance("SHA1");
            md.update(key.getBytes(_utf8));
            md.update(MAGIC);
            return Base64.encodeToString(md.digest(), Base64.NO_WRAP);
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }

    /* ------------------------------------------------------------ */
    @Override
    public String toString()
    {
        return String.format("%s p=%s g=%s", getClass().getSimpleName(), _parser, _generator);
    }
}
