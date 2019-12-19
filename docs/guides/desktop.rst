Desktop port tips
=================

Scope
-----

This page is dedicated to the Desktop version of zmNinja and tips &
tricks

Command Line parameters
-----------------------

The following command line parameters are supported:

::

    --path=<dir>  - starts zmNinja and stores user profile information to that directory. 
                    This allows you to switch between different user settings.

    --fs          - starts zmNinja in full screen mode

    --lang        - specifies a language profile that will be used to display input 
                    dates etc. Just switching a "language" in zmNinja does not affect browser
                    default language. I currently don't know how to wire this to zmNinja's language
                    as this is electron stuff so you'll have to pass it as command line.

Multiple instances
------------------

It is actually possible to launch multiple instances of the same desktop
app from command line. This allows you to watch different servers at the
same time as well as use multiple monitors. I strongly recommend you use
unique ``--path`` arguments with each instance because otherwise one
instance will conflict with another.

So lets say you want to run 2 copies of zmNinja at the same time:

::

    mkdir -p /path/to/instance1
    mkdir -p /path/to/instance2

And then:

::

    # for linux
    zmninjapro-1.3.22-x86_64.AppImage  --path=/path/to/instance1
    zmninjapro-1.3.22-x86_64.AppImage  --path=/path/to/instance2

    #for OSX. Note the -n is critical to launch a new instance
    open -n ./zmninjapro.app --args --path=/path/to/instance1 &
    open -n ./zmninjapro.app --args --path=/path/to/instance2 &

Hotkeys
-------

The following hotkeys are supported while the app is running:

::

    [Cmd/Ctrl] + L         -> Lock app (if pin code is being used)
    [Cmd/Ctrl] + Shift + F -> toggle between full screen and windowed mode
    [Cmd/Ctrl] + Shift + D -> opens the debug window. 
                            Super useful to see what is going on, 
                            especially when things don't work

Keyboard bindings
-----------------

**Live Monitor View (single view, not montage):**

::

    Arrow Left  -> move to previous monitor
    Arrow Right -> move to next monitor
    Esc         -> remove live view
    P           -> toggle PTZ

**PTZ Operations to move (PTZ should be toggled to on first):**

::

    Q W E  -> UpLeft, Up, UpRight
    A S D  -> Left, Home,Right
    Z X C  -> DownLeft, Down, DownRight

**Event Footage View:**

::

    Arrow Left  -> move to previous event
    Arrow Right -> move to next event
    Enter       -> play the event if in snapshot mode (shows red play button)
    Esc         -> remove event footage view

**Timeline:**

::

    Arrow Up    -> Zoom In
    Arrow Down  -> Zoom Out
    Arrow Left  -> Pan Left
    Arrow Right -> Pan Right
    Esc         -> Fit timeline back to view (reset)
    A           -> Previous Day
    D           -> Next Day

Desktop data storage locations
------------------------------

User data is typically stored in the following locations:
- ``%APPDATA%/zmNinjaDesktop`` for Windows,
- ``$XDG_CONFIG_HOME/zmNinjaDesktop`` or ``~/.config/zmNinjaDesktop`` for Linux, 
- ``~/Library/Application Support/zmNinjaDesktop`` for OSX

To completely remove the app, you may want to delete both the app
bundle/binary and these locations as applicable on your system
