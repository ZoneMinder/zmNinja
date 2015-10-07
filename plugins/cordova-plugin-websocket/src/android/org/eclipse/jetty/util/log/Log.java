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

package org.eclipse.jetty.util.log;

/**
 * Logging.
 *
 * Modified by KNOWLEDGECODE
 */
public class Log
{
    public static final String EXCEPTION = "EXCEPTION ";
    public static final String IGNORED = "IGNORED ";

    private static Logger LOG = new Logger()
    {
        @Override
        public String getName()
        {
            return null;
        }

        @Override
        public void warn(String msg, Object... args)
        {
        }

        @Override
        public void warn(Throwable thrown)
        {
        }

        @Override
        public void warn(String msg, Throwable thrown)
        {
        }

        @Override
        public void info(String msg, Object... args)
        {
        }

        @Override
        public void info(Throwable thrown)
        {
        }

        @Override
        public void info(String msg, Throwable thrown)
        {
        }

        @Override
        public boolean isDebugEnabled()
        {
            return false;
        }

        @Override
        public void setDebugEnabled(boolean enabled)
        {
        }

        @Override
        public void debug(String msg, Object... args)
        {
        }

        @Override
        public void debug(Throwable thrown)
        {
        }

        @Override
        public void debug(String msg, Throwable thrown)
        {
        }

        @Override
        public Logger getLogger(String name)
        {
            return this;
        }

        @Override
        public void ignore(Throwable ignored)
        {
        }
    };

    static
    {
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        try
        {
            @SuppressWarnings("unchecked")
            Class<Logger> clazz = (Class<Logger>) loader.loadClass("org.eclipse.jetty.util.log.AndroidLogger");
            LOG = clazz.newInstance();
        }
        catch (ClassNotFoundException e)
        {
        }
        catch (IllegalAccessException e)
        {
        }
        catch (IllegalArgumentException e)
        {
        }
        catch (InstantiationException e)
        {
        }
    }

    /**
     * Obtain a named Logger based on the fully qualified class name.
     *
     * @param clazz
     *            the class to base the Logger name off of
     * @return the Logger with the given name
     */
    public static Logger getLogger(Class<?> clazz)
    {
        return getLogger(clazz.getName());
    }

    /**
     * Obtain a named Logger or the default Logger if null is passed.
     * @param name the Logger name
     * @return the Logger with the given name
     */
    public static Logger getLogger(String name)
    {
        return LOG.getLogger(name);
    }
}
