package com.knowledgecode.cordova.websocket;

import org.apache.cordova.CallbackContext;

class TaskBean {
    private final String _action;
    private final String _rawArgs;
    private final CallbackContext _ctx;

    public TaskBean(final String action) {
        _action = action;
        _rawArgs = "[]";
        _ctx = null;
    }

    public TaskBean(final String action, final String rawArgs, final CallbackContext ctx) {
        _action = action;
        _rawArgs = rawArgs;
        _ctx = ctx;
    }

    public String getAction() {
        return _action;
    }

    public String getRawArgs() {
        return _rawArgs;
    }

    public CallbackContext getCtx() {
        return _ctx;
    }
}
