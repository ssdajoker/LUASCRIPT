"use strict";

const levelOrder = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();
const LOG_SILENT = process.env.LOG_SILENT === "1" || LOG_LEVEL === "silent";
const LOG_NAMESPACES = (process.env.LOG_NAMESPACES || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

let customSink = null;

function shouldLog(level, namespace) {
    if (LOG_SILENT) return false;
    const normalizedLevel = (level || "info").toLowerCase();
    const threshold = levelOrder[LOG_LEVEL] ?? levelOrder.info;
    const targetLevel = levelOrder[normalizedLevel];
    if (typeof targetLevel !== "number" || targetLevel > threshold) {
        return false;
    }
    if (LOG_NAMESPACES.length === 0) {
        return true;
    }
    return namespace && LOG_NAMESPACES.includes(namespace);
}

function emit(level, namespace, ...args) {
    if (!shouldLog(level, namespace)) return;
    const method = level === "debug" ? "log" : level;
    const prefix = namespace ? `[${level.toUpperCase()}][${namespace}]` : `[${level.toUpperCase()}]`;
    if (customSink) {
        customSink(method, prefix, args);
        return;
    }
    if (typeof console[method] === "function") {
        console[method](prefix, ...args);
    } else {
        console.log(prefix, ...args);
    }
}

function createLogger(namespace) {
    return {
        debug: (...args) => emit("debug", namespace, ...args),
        info: (...args) => emit("info", namespace, ...args),
        warn: (...args) => emit("warn", namespace, ...args),
        error: (...args) => emit("error", namespace, ...args),
    };
}

function setSink(fn) {
    customSink = typeof fn === "function" ? fn : null;
}

module.exports = {
    LOG_LEVEL,
    LOG_SILENT,
    LOG_NAMESPACES,
    createLogger,
    setSink,
    shouldLog,
};
