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

package org.eclipse.jetty.io;

/* ------------------------------------------------------------------------------- */
/** Buffer utility methods.
 * 
 * 
 */
public class BufferUtil
{
    static final byte SPACE= 0x20;
    static final byte MINUS= '-';

    /**
     * Convert buffer to an long.
     * Parses up to the first non-numeric character. If no number is found an
     * IllegalArgumentException is thrown
     * @param buffer A buffer containing an integer. The position is not changed.
     * @return an int 
     */
    public static long toLong(Buffer buffer)
    {
        long val= 0;
        boolean started= false;
        boolean minus= false;
        for (int i= buffer.getIndex(); i < buffer.putIndex(); i++)
        {
            byte b= buffer.peek(i);
            if (b <= SPACE)
            {
                if (started)
                    break;
            }
            else if (b >= '0' && b <= '9')
            {
                val= val * 10L + (b - '0');
                started= true;
            }
            else if (b == MINUS && !started)
            {
                minus= true;
            }
            else
                break;
        }

        if (started)
            return minus ? (-val) : val;
        throw new NumberFormatException(buffer.toString());
    }
}
