import * as fs from "fs";
import * as path from "path";
import { AftConfig, convert, rand } from "aft-core";
import { FilesystemLoggingPlugin, FilesystemLoggingPluginConfig } from "../src/filesystem-logging-plugin";

describe('FilesystemLoggingPlugin', () => {
    beforeEach(() => {
        const logDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, {recursive: true, force: true});
        }
    });

    it('can create a file on the filesystem and write logs to it', async () => {
        const aftCfg = new AftConfig();
        const plugin = new FilesystemLoggingPlugin(aftCfg);
        const logName = 'can create a file on the filesystem and write logs to it';
        await plugin.log(logName, 'trace', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'info', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'error', rand.getString(rand.getInt(100, 200)));
        await plugin.submitResult(logName, {
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'passed'
        });
        await plugin.submitResult(logName, {
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'skipped'
        });
        await plugin.submitResult(logName, {
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'failed'
        });
        await plugin.submitResult(logName, {
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'untested'
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
        const aftCfg = new AftConfig({
            FilesystemLoggingPluginConfig: {
                logLevel: 'error'
            }
        });
        const plugin = new FilesystemLoggingPlugin(aftCfg);
        const logName = 'will not write to file if level below specified value';
        await plugin.log(logName, 'trace', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'debug', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'info', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'step', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'pass', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'fail', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'warn', rand.getString(rand.getInt(100, 200)));
        await plugin.log(logName, 'error', rand.getString(rand.getInt(100, 200)));

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('ERROR');
        expect(lines[1]).toEqual('');
    });

    it('can change the date formatting', async () => {
        const logName = 'can change the date formatting';
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(FilesystemLoggingPluginConfig);
        config.logLevel = 'info';
        config.dateFormat = 'SSS';
        const plugin = new FilesystemLoggingPlugin(aftCfg);

        await plugin.log(logName, 'warn', rand.getString(rand.getInt(100, 200)));

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toMatch(/^\[[0-9]{3}\] - WARN - .+$/);
        expect(lines[1]).toEqual('');
    });

    it('can disable output of TestResult objects', async () => {
        const logName = 'can disable output of TestResult objects';
        const aftCfg = new AftConfig({
            FilesystemLoggingPluginConfig: {
                logLevel: 'trace',
                includeResults: false
            }
        });
        const plugin = new FilesystemLoggingPlugin(aftCfg);

        await plugin.submitResult(logName, {
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'passed'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeFalse();
    });
});