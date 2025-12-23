"use strict";

const fs = require("fs");
const path = require("path");

const PERF_ENABLE = process.env.PERF_ENABLE === "1" || process.env.PERF === "1";
const PERF_OUT = process.env.PERF_OUT || path.join(process.cwd(), "reports", "perf");

const state = {
    enabled: PERF_ENABLE,
    startedAt: Date.now(),
    counters: Object.create(null),
    timings: [],
    events: [],
};

function ensureDirSync(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch {
        // Directory already exists or permission denied - non-critical
    }
}

function nowNs() {
    return process.hrtime.bigint();
}

function timeBlock(label) {
    if (!state.enabled) return { end: () => ({ label, ms: 0 }) };
    const start = nowNs();
    return {
        end(extra = {}) {
            const end = nowNs();
            const ms = Number(end - start) / 1e6;
            const rec = { label, ms, ...extra, t: Date.now() };
            state.timings.push(rec);
            return rec;
        },
    };
}

function incrementCounter(name, by = 1) {
    if (!state.enabled) return;
    state.counters[name] = (state.counters[name] || 0) + by;
}

function recordEvent(name, payload = {}) {
    if (!state.enabled) return;
    state.events.push({ name, payload, t: Date.now() });
}

function snapshot(kind = "snapshot") {
    if (!state.enabled) return;
    ensureDirSync(PERF_OUT);
    const file = path.join(PERF_OUT, `${kind}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    const data = {
        startedAt: state.startedAt,
        capturedAt: Date.now(),
        counters: state.counters,
        timings: state.timings.slice(-500),
        events: state.events.slice(-200),
        pid: process.pid,
    };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return file;
}

function getState() {
    return { ...state, timings: state.timings.slice(), events: state.events.slice() };
}

module.exports = {
    PERF_ENABLE,
    PERF_OUT,
    timeBlock,
    incrementCounter,
    recordEvent,
    snapshot,
    getState,
};
