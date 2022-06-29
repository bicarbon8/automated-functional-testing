import * as fs from "fs";
import * as path from "path";
import { convert, rand } from "aft-core";
import { FilesystemLoggingPlugin } from "../src/filesystem-logging-plugin";

describe('FilesystemLoggingPlugin', () => {
    beforeEach(() => {
        const logDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, {recursive: true, force: true});
        }
    });

    it('can create a file on the filesystem and write logs to it', async () => {
        const plugin = new FilesystemLoggingPlugin({
            level: 'trace'
        });
        const logName = 'can create a file on the filesystem and write logs to it';
        await plugin.log({
            name: logName,
            level: 'trace',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'info',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'error',
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
        const plugin = new FilesystemLoggingPlugin({
            level: 'error'
        });
        const logName = 'will not write to file if level below specified value';
        await plugin.log({
            name: logName,
            level: 'trace',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'debug',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'info',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'step',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'pass',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'fail',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'warn',
            message: rand.getString(rand.getInt(100, 200))
        });
        await plugin.log({
            name: logName,
            level: 'error',
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
        const plugin = new FilesystemLoggingPlugin({
            level: 'info',
            dateFormat: 'SSS'
        });

        await plugin.log({name: logName, level: 'warn', message: rand.getString(rand.getInt(100, 200))});

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toMatch(/^\[[0-9]{3}\] - WARN - .+$/);
        expect(lines[1]).toEqual('');
    });

    it('can disable output of TestResult objects', async () => {
        const logName = 'can disable output of TestResult objects';
        const plugin = new FilesystemLoggingPlugin({
            level: 'trace',
            includeResults: false
        });

        await plugin.logResult(logName, {
            resultId: rand.guid,
            created: Date.now(),
            status: 'Passed'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeFalse();
    });
});