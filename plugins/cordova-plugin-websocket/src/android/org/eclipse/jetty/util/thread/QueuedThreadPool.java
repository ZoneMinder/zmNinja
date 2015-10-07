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


package org.eclipse.jetty.util.thread;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.eclipse.jetty.util.BlockingArrayQueue;
import org.eclipse.jetty.util.ConcurrentHashSet;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.component.AggregateLifeCycle;
import org.eclipse.jetty.util.component.Dumpable;
import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;

public class QueuedThreadPool extends AbstractLifeCycle implements ThreadPool, Executor, Dumpable
{
    private static final Logger LOG = Log.getLogger(QueuedThreadPool.class);

    private final AtomicInteger _threadsStarted = new AtomicInteger();
    private final AtomicInteger _threadsIdle = new AtomicInteger();
    private final AtomicLong _lastShrink = new AtomicLong();
    private final ConcurrentHashSet<Thread> _threads=new ConcurrentHashSet<Thread>();
    private final Object _joinLock = new Object();
    private BlockingQueue<Runnable> _jobs;
    private String _name;
    private int _maxIdleTimeMs=60000;
    private int _maxThreads=254;
    private int _minThreads=8;
    private int _maxQueued=-1;
    private int _priority=Thread.NORM_PRIORITY;
    private boolean _daemon=false;
    private int _maxStopTime=100;
    private boolean _detailedDump=false;

    /* ------------------------------------------------------------------- */
    /** Construct
     */
    public QueuedThreadPool()
    {
        _name="qtp"+super.hashCode();
    }

    /* ------------------------------------------------------------ */
    @Override
    protected void doStart() throws Exception
    {
        super.doStart();
        _threadsStarted.set(0);

        if (_jobs==null)
        {
            _jobs=_maxQueued>0 ?new ArrayBlockingQueue<Runnable>(_maxQueued)
                :new BlockingArrayQueue<Runnable>(_minThreads,_minThreads);
        }

        int threads=_threadsStarted.get();
        while (isRunning() && threads<_minThreads)
        {
            startThread(threads);
            threads=_threadsStarted.get();
        }
    }

    /* ------------------------------------------------------------ */
    @Override
    protected void doStop() throws Exception
    {
        super.doStop();
        long start=System.currentTimeMillis();

        // let jobs complete naturally for a while
        while (_threadsStarted.get()>0 && (System.currentTimeMillis()-start) < (_maxStopTime/2))
            Thread.sleep(1);

        // kill queued jobs and flush out idle jobs
        _jobs.clear();
        Runnable noop = new Runnable(){public void run(){}};
        for  (int i=_threadsIdle.get();i-->0;)
            _jobs.offer(noop);
        Thread.yield();

        // interrupt remaining threads
        if (_threadsStarted.get()>0)
            for (Thread thread : _threads)
                thread.interrupt();

        // wait for remaining threads to die
        while (_threadsStarted.get()>0 && (System.currentTimeMillis()-start) < _maxStopTime)
        {
            Thread.sleep(1);
        }
        Thread.yield();
        int size=_threads.size();
        if (size>0)
        {
            LOG.warn(size+" threads could not be stopped");

            if (size==1 || LOG.isDebugEnabled())
            {
                for (Thread unstopped : _threads)
                {
                    LOG.info("Couldn't stop "+unstopped);
                    for (StackTraceElement element : unstopped.getStackTrace())
                    {
                        LOG.info(" at "+element);
                    }
                }
            }
        }

        synchronized (_joinLock)
        {
            _joinLock.notifyAll();
        }
    }

    /* ------------------------------------------------------------ */
    /** Set the maximum number of threads.
     * Delegated to the named or anonymous Pool.
     * @see #setMaxThreads
     * @return maximum number of threads.
     */
    public int getMaxThreads()
    {
        return _maxThreads;
    }

    /* ------------------------------------------------------------ */
    /** Get the minimum number of threads.
     * Delegated to the named or anonymous Pool.
     * @see #setMinThreads
     * @return minimum number of threads.
     */
    public int getMinThreads()
    {
        return _minThreads;
    }

    /* ------------------------------------------------------------ */
    public boolean dispatch(Runnable job)
    {
        if (isRunning())
        {
            final int jobQ = _jobs.size();
            final int idle = getIdleThreads();
            if(_jobs.offer(job))
            {
                // If we had no idle threads or the jobQ is greater than the idle threads
                if (idle==0 || jobQ>idle)
                {
                    int threads=_threadsStarted.get();
                    if (threads<_maxThreads)
                        startThread(threads);
                }
                return true;
            }
        }
        LOG.debug("Dispatched {} to stopped {}",job,this);
        return false;
    }

    /* ------------------------------------------------------------ */
    public void execute(Runnable job)
    {
        if (!dispatch(job))
            throw new RejectedExecutionException();
    }

    /* ------------------------------------------------------------ */
    /**
     * @return The total number of threads currently in the pool
     */
    public int getThreads()
    {
        return _threadsStarted.get();
    }

    /* ------------------------------------------------------------ */
    /**
     * @return The number of idle threads in the pool
     */
    public int getIdleThreads()
    {
        return _threadsIdle.get();
    }

    /* ------------------------------------------------------------ */
    private boolean startThread(int threads)
    {
        final int next=threads+1;
        if (!_threadsStarted.compareAndSet(threads,next))
            return false;

        boolean started=false;
        try
        {
            Thread thread=newThread(_runnable);
            thread.setDaemon(_daemon);
            thread.setPriority(_priority);
            thread.setName(_name+"-"+thread.getId());
            _threads.add(thread);

            thread.start();
            started=true;
        }
        finally
        {
            if (!started)
                _threadsStarted.decrementAndGet();
        }
        return started;
    }

    /* ------------------------------------------------------------ */
    protected Thread newThread(Runnable runnable)
    {
        return new Thread(runnable);
    }

    /* ------------------------------------------------------------ */
    public void dump(Appendable out, String indent) throws IOException
    {
        List<Object> dump = new ArrayList<Object>(getMaxThreads());
        for (final Thread thread: _threads)
        {
            final StackTraceElement[] trace=thread.getStackTrace();
            boolean inIdleJobPoll=false;
            // trace can be null on early java 6 jvms
            if (trace != null)
            {
                for (StackTraceElement t : trace)
                {
                    if ("idleJobPoll".equals(t.getMethodName()))
                    {
                        inIdleJobPoll = true;
                        break;
                    }
                }
            }
            final boolean idle=inIdleJobPoll;

            if (_detailedDump)
            {
                dump.add(new Dumpable()
                {
                    public void dump(Appendable out, String indent) throws IOException
                    {
                        out.append(String.valueOf(thread.getId())).append(' ').append(thread.getName()).append(' ').append(thread.getState().toString()).append(idle?" IDLE":"").append('\n');
                        if (!idle)
                            AggregateLifeCycle.dump(out,indent,Arrays.asList(trace));
                    }
                });
            }
            else
            {
                dump.add(thread.getId()+" "+thread.getName()+" "+thread.getState()+" @ "+(trace.length>0?trace[0]:"???")+(idle?" IDLE":""));
            }
        }

        AggregateLifeCycle.dumpObject(out,this);
        AggregateLifeCycle.dump(out,indent,dump);
    }

    /* ------------------------------------------------------------ */
    @Override
    public String toString()
    {
        return _name+"{"+getMinThreads()+"<="+getIdleThreads()+"<="+getThreads()+"/"+getMaxThreads()+","+(_jobs==null?-1:_jobs.size())+"}";
    }

    /* ------------------------------------------------------------ */
    private Runnable idleJobPoll() throws InterruptedException
    {
        return _jobs.poll(_maxIdleTimeMs,TimeUnit.MILLISECONDS);
    }

    /* ------------------------------------------------------------ */
    private Runnable _runnable = new Runnable()
    {
        public void run()
        {
            boolean shrink=false;
            try
            {
                Runnable job=_jobs.poll();
                while (isRunning())
                {
                    // Job loop
                    while (job!=null && isRunning())
                    {
                        runJob(job);
                        job=_jobs.poll();
                    }

                    // Idle loop
                    try
                    {
                        _threadsIdle.incrementAndGet();

                        while (isRunning() && job==null)
                        {
                            if (_maxIdleTimeMs<=0)
                                job=_jobs.take();
                            else
                            {
                                // maybe we should shrink?
                                final int size=_threadsStarted.get();
                                if (size>_minThreads)
                                {
                                    long last=_lastShrink.get();
                                    long now=System.currentTimeMillis();
                                    if (last==0 || (now-last)>_maxIdleTimeMs)
                                    {
                                        shrink=_lastShrink.compareAndSet(last,now) &&
                                        _threadsStarted.compareAndSet(size,size-1);
                                        if (shrink)
                                            return;
                                    }
                                }
                                job=idleJobPoll();
                            }
                        }
                    }
                    finally
                    {
                        _threadsIdle.decrementAndGet();
                    }
                }
            }
            catch(InterruptedException e)
            {
                LOG.ignore(e);
            }
            catch(Exception e)
            {
                LOG.warn(e);
            }
            finally
            {
                if (!shrink)
                    _threadsStarted.decrementAndGet();
                _threads.remove(Thread.currentThread());
            }
        }
    };

    /* ------------------------------------------------------------ */
    /**
     * <p>Runs the given job in the {@link Thread#currentThread() current thread}.</p>
     * <p>Subclasses may override to perform pre/post actions before/after the job is run.</p>
     *
     * @param job the job to run
     */
    protected void runJob(Runnable job)
    {
        job.run();
    }
}
