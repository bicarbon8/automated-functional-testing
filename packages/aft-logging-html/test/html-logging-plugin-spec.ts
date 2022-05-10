import * as fs from "fs";
import * as path from "path";
import { LoggingPlugin, LogLevel, LogManager, rand } from "aft-core";
import { HtmlLoggingPlugin } from "../src";

describe('HtmlLoggingPlugin', () => {
    afterEach(() => {
        let c: string = path.join(process.cwd(), '.htmlCache');
        if (fs.existsSync(c)) {fs.unlinkSync(c);}
    });
    
    it('stores the specified number of log lines', async () => {
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin({
            enabled: true,
            level: "info",
            maxLogLines: 14
        });
        for (var i=0; i<25; i++) {
            await plugin.log(LogLevel.info, rand.getString(100));
        }

        let actual: string[] = plugin.getLogs();
        expect(actual.length).toBe(14);
    });

    it('adds an ellipsis to the oldest log line only when exceeded maxLogLines', async () => {
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin({
            enabled: true,
            level: "info",
            maxLogLines: 3
        });
        for (var i=0; i<3; i++) {
            await plugin.log(LogLevel.info, rand.getString(100));
        }

        let actual: string[] = plugin.getLogs();
        expect(actual.length).toBe(3);
        expect(actual[0]).not.toContain('...');

        await plugin.log(LogLevel.info, rand.getString(100));

        actual = plugin.getLogs();
        expect(actual.length).toBe(3);
        expect(actual[0]).toContain('...');
    });

    it('stores logs only when at or above the specified level', async () => {
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin({
            enabled: true,
            level: "step",
            maxLogLines: 14
        });
        await plugin.log(LogLevel.none, 'level none');
        await plugin.log(LogLevel.trace, 'level trace');
        await plugin.log(LogLevel.debug, 'level debug');
        await plugin.log(LogLevel.info, 'level info');
        await plugin.log(LogLevel.step, 'level step');
        await plugin.log(LogLevel.warn, 'level warn');
        await plugin.log(LogLevel.pass, 'level pass');
        await plugin.log(LogLevel.fail, 'level fail');
        await plugin.log(LogLevel.error, 'level error');

        let actual: string[] = plugin.getLogs();
        expect(actual.length).toBe(5);
        expect(actual).not.toContain('level none');
        expect(actual).not.toContain('level trace');
        expect(actual).not.toContain('level debug');
        expect(actual).not.toContain('level info');
    });

    it('can be loaded successfully from the LogManager', async () => {
        let logMgr: LogManager = new LogManager({
            pluginNames: ['html-logging-plugin']
        });
        let plugins: LoggingPlugin[] = await logMgr.getPlugins();

        expect(plugins).toBeDefined();
        expect(plugins.length).toBeGreaterThan(0);
        expect(plugins[0].constructor.name).toEqual('HtmlLoggingPlugin');
    });
});