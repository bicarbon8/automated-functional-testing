import * as fs from "fs";
import * as path from "path";
import { ConfigManager, convert, rand } from "aft-core";
import { FilesystemLoggingPlugin, FilesystemLoggingPluginConfig } from "../src/filesystem-logging-plugin";

describe('FilesystemLoggingPlugin', () => {
    beforeEach(() => {
        const logDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, {recursive: true, force: true});
        }
    });

    it('can create a file on the filesystem and write logs to it', async () => {
        const cfgMgr = new ConfigManager();
        const plugin = new FilesystemLoggingPlugin(cfgMgr);
        const logName = 'can create a file on the filesystem and write logs to it';
        await plugin.log({
            name: logName,
            logLevel: 'trace',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'info',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'error',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Passed'
        });
        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Skipped'
        });
        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Failed'
        });
        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Untested'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(8); // 7 logged lines plus one empty due to newline at end of each line
        expect(lines[0]).toContain('TRACE');
        expect(lines[6]).toContain('INFO');
        expect(lines[7]).toEqual('');
    });

    it('will not write to file if level below specified value', async () => {
        const cfgMgr = new ConfigManager({
            FilesystemLoggingPluginConfig: {
                logLevel: 'error'
            }
        });
        const plugin = new FilesystemLoggingPlugin(cfgMgr);
        const logName = 'will not write to file if level below specified value';
        await plugin.log({
            name: logName,
            logLevel: 'trace',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'debug',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'info',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'step',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'pass',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'fail',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'warn',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            logLevel: 'error',
            message: rand.getString(rand.getInt(100, 200))
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('ERROR');
        expect(lines[1]).toEqual('');
    });

    it('can change the date formatting', async () => {
        const logName = 'can change the date formatting';
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(FilesystemLoggingPluginConfig);
        config.logLevel = 'info';
        config.dateFormat = 'SSS';
        const plugin = new FilesystemLoggingPlugin(cfgMgr);

        await plugin.log({name: logName, logLevel: 'warn', message: rand.getString(rand.getInt(100, 200))});

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toMatch(/^\[[0-9]{3}\] - WARN - .+$/);
        expect(lines[1]).toEqual('');
    });

    it('can disable output of TestResult objects', async () => {
        const logName = 'can disable output of TestResult objects';
        const cfgMgr = new ConfigManager({
            FilesystemLoggingPluginConfig: {
                logLevel: 'trace',
                includeResults: false
            }
        });
        const plugin = new FilesystemLoggingPlugin(cfgMgr);

        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Passed'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeFalse();
    });
});