import * as fs from "fs";
import * as path from "path";
import { AftConfig, convert, ellide, rand } from "aft-core";
import { FilesystemReportingPlugin, FilesystemReportingPluginConfig } from "../src/filesystem-reporting-plugin";

describe('FilesystemReportingPlugin', () => {
    beforeEach(() => {
        const logDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, {recursive: true, force: true});
        }
    });

    it('can create a file on the filesystem and write logs to it', async () => {
        const aftCfg = new AftConfig();
        const plugin = new FilesystemReportingPlugin(aftCfg);
        const name = 'can create a file on the filesystem and write logs to it';
        await plugin.log({name, level: 'trace', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'info', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'error', message: rand.getString(rand.getInt(100, 200))});
        await plugin.submitResult({
            testName: name,
            resultId: rand.guid,
            created: Date.now(),
            status: 'passed'
        });
        await plugin.submitResult({
            testName: name,
            resultId: rand.guid,
            created: Date.now(),
            status: 'skipped'
        });
        await plugin.submitResult({
            testName: name,
            resultId: rand.guid,
            created: Date.now(),
            status: 'failed'
        });
        await plugin.submitResult({
            testName: name,
            resultId: rand.guid,
            created: Date.now(),
            status: 'untested'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(name)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(8); // 7 logged lines plus one empty due to newline at end of each line
        expect(lines[0]).toContain('TRACE');
        expect(lines[6]).toContain('INFO');
        expect(lines[7]).toEqual('');
    });

    it('will not write to file if level below specified value', async () => {
        const aftCfg = new AftConfig({
            FilesystemReportingPluginConfig: {
                logLevel: 'error'
            }
        });
        const plugin = new FilesystemReportingPlugin(aftCfg);
        const name = 'will not write to file if level below specified value';
        await plugin.log({name, level: 'trace', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'debug', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'info', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'step', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'pass', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'fail', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'warn', message: rand.getString(rand.getInt(100, 200))});
        await plugin.log({name, level: 'error', message: rand.getString(rand.getInt(100, 200))});

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(name)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('ERROR');
        expect(lines[1]).toEqual('');
    });

    it('can change the date formatting', async () => {
        const name = 'can change the date formatting';
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(FilesystemReportingPluginConfig);
        config.logLevel = 'info';
        config.dateFormat = 'SSS';
        const plugin = new FilesystemReportingPlugin(aftCfg);

        await plugin.log({name, level: 'warn', message: rand.getString(rand.getInt(100, 200))});

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(name)}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();

        const lines: Array<string> = fs.readFileSync(filePath, {encoding: 'utf-8'})?.split('\n') || [];
        expect(lines.length).toBe(2);
        expect(lines[0]).toMatch(/^\[[0-9]{3}\] - WARN - .+$/);
        expect(lines[1]).toEqual('');
    });

    it('can disable output of TestResult objects', async () => {
        const logName = 'can disable output of TestResult objects';
        const aftCfg = new AftConfig({
            FilesystemReportingPluginConfig: {
                logLevel: 'trace',
                includeResults: false
            }
        });
        const plugin = new FilesystemReportingPlugin(aftCfg);

        await plugin.submitResult({
            testName: logName,
            resultId: rand.guid,
            created: Date.now(),
            status: 'passed'
        });

        const filePath = path.join(process.cwd(), 'logs', `${convert.toSafeString(logName)}.log`);
        expect(fs.existsSync(filePath)).toBeFalse();
    });

    it('truncates exceptionally long filenames based on config', async () => {
        const maxLength = 10;
        const aftCfg = new AftConfig({
            FilesystemReportingPluginConfig: {
                maxFilenameLength: maxLength
            }
        });
        const plugin = new FilesystemReportingPlugin(aftCfg);
        const name = 'the quick brown fox jumped over the lazy dogs';
        await plugin.log({name, level: 'error', message: rand.getString(rand.getInt(100, 200))});

        const filePath = path.join(process.cwd(), 'logs', `${ellide(convert.toSafeString(name), maxLength, 'middle')}.log`);
        expect(fs.existsSync(filePath)).toBeTrue();
    })
});
