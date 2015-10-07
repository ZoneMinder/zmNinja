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
//  You may elect to redistribute this code under either of these licenses.
//  ========================================================================
//

package org.eclipse.jetty.util.resource;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;

/* ------------------------------------------------------------ */
/** Abstract resource class.
 */
public class URLResource extends Resource
{
    private static final Logger LOG = Log.getLogger(URLResource.class);
    protected URL _url;
    protected String _urlString;

    protected URLConnection _connection;
    protected InputStream _in=null;
    transient boolean _useCaches = Resource.__defaultUseCaches;

    /* ------------------------------------------------------------ */
    protected URLResource(URL url, URLConnection connection)
    {
        _url = url;
        _urlString=_url.toString();
        _connection=connection;
    }

    /* ------------------------------------------------------------ */
    protected URLResource (URL url, URLConnection connection, boolean useCaches)
    {
        this (url, connection);
        _useCaches = useCaches;
    }

    /* ------------------------------------------------------------ */
    protected synchronized boolean checkConnection()
    {
        if (_connection==null)
        {
            try{
                _connection=_url.openConnection();
                _connection.setUseCaches(_useCaches);
            }
            catch(IOException e)
            {
                LOG.ignore(e);
            }
        }
        return _connection!=null;
    }

    /* ------------------------------------------------------------ */
    /** Release any resources held by the resource.
     */
    @Override
    public synchronized void release()
    {
        if (_in!=null)
        {
            try{_in.close();}catch(IOException e){LOG.ignore(e);}
            _in=null;
        }

        if (_connection!=null)
            _connection=null;
    }

    /* ------------------------------------------------------------ */
    /**
     * Returns an input stream to the resource
     */
    @Override
    public synchronized InputStream getInputStream()
        throws java.io.IOException
    {
        if (!checkConnection())
            throw new IOException( "Invalid resource");

        try
        {
            if( _in != null)
            {
                InputStream in = _in;
                _in=null;
                return in;
            }
            return _connection.getInputStream();
        }
        finally
        {
            _connection=null;
        }
    }

    /* ------------------------------------------------------------ */
    @Override
    public String toString()
    {
        return _urlString;
    }

    /* ------------------------------------------------------------ */
    @Override
    public boolean equals( Object o)
    {
        return o instanceof URLResource && _urlString.equals(((URLResource)o)._urlString);
    }
}
