"use strict";

const assert = require("assert");

function loadLoggerWithEnv(env = {}) {
    const loggerPath = require.resolve("../../src/utils/logger");
    delete require.cache[loggerPath];

    Object.keys(env).forEach((key) => {
        if (env[key] === undefined || env[key] === null) {
            delete process.env[key];
        } else {
            process.env[key] = env[key];
        }
    });

    return require(loggerPath);
}

function captureLogs(loggerModule, namespace, emitFn) {
    const sink = [];
    loggerModule.setSink((method, prefix, args) => {
        sink.push({ method, prefix, args });
    });
    emitFn(loggerModule.createLogger(namespace));
    loggerModule.setSink(null);
    return sink;
}

describe("logger wrapper", () => {
    afterEach(() => {
        delete process.env.LOG_LEVEL;
        delete process.env.LOG_SILENT;
        delete process.env.LOG_NAMESPACES;
    });

    it("respects log level thresholds", () => {
        const loggerModule = loadLoggerWithEnv({ LOG_LEVEL: "info" });
        const logs = captureLogs(loggerModule, "runtime", (logger) => {
            logger.debug("skip-this");
            logger.info("hello");
            logger.warn("warned");
        });

        assert.strictEqual(logs.length, 2);
        assert.strictEqual(logs[0].method, "info");
        assert.strictEqual(logs[0].prefix, "[INFO][runtime]");
        assert.deepStrictEqual(logs[0].args, ["hello"]);
        assert.strictEqual(logs[1].method, "warn");
        assert.deepStrictEqual(logs[1].args, ["warned"]);
    });

    it("filters by namespace when provided", () => {
        const loggerModule = loadLoggerWithEnv({ LOG_LEVEL: "debug", LOG_NAMESPACES: "core,perf" });
        const logs = captureLogs(loggerModule, "perf", (logger) => {
            const other = loggerModule.createLogger("ui");
            other.info("ignore");
            logger.debug("allowed");
        });

        assert.strictEqual(logs.length, 1);
        assert.strictEqual(logs[0].prefix, "[DEBUG][perf]");
        assert.deepStrictEqual(logs[0].args, ["allowed"]);
    });

    it("can be silenced entirely", () => {
        const loggerModule = loadLoggerWithEnv({ LOG_LEVEL: "debug", LOG_SILENT: "1" });
        const logs = captureLogs(loggerModule, "runtime", (logger) => {
            logger.error("should-not-emit");
        });

        assert.strictEqual(logs.length, 0);
    });
});
