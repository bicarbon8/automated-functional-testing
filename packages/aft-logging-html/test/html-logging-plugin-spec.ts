import * as fs from "fs";
import * as path from "path";
import { AftConfig, LogManager, rand, TestResult } from "aft-core";
import { HtmlLoggingPlugin, HtmlLoggingPluginConfig } from "../src";
import { HtmlResult } from "../src/html-result";

describe('HtmlLoggingPlugin', () => {
    beforeEach(() => {
        let c: string = path.join(process.cwd(), 'FileSystemMap', 'htmlSharedResults.json');
        if (fs.existsSync(c)) {fs.unlinkSync(c);}
        let d: string = path.join(process.cwd(), 'FileSystemMap', 'htmlSharedLogs.json');
        if (fs.existsSync(d)) {fs.unlinkSync(d);}
        let e: string = path.join(process.cwd(), 'testresults.html');
        if (fs.existsSync(e)) {fs.unlinkSync(e);}
    });
    
    it('stores the specified number of log lines', async () => {
        const config = {
            logLevel: 'info',
            maxLogLines: 14
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(new AftConfig({
            HtmlLoggingPluginConfig: config
        }));
        const logName = rand.getString(50);
        for (var i=0; i<25; i++) {
            await plugin.log(logName, 'info', rand.getString(100));
        }

        let actual: string[] = plugin.logs(logName);
        expect(actual.length).toBe(14);
    });

    it('adds an ellipsis to the oldest log line only when exceeded maxLogLines', async () => {
        const config = {
            logLevel: 'info',
            maxLogLines: 3
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(new AftConfig({
            HtmlLoggingPluginConfig: config
        }));
        const logName = rand.getString(50);
        for (var i=0; i<3; i++) {
            await plugin.log(logName, 'info', rand.getString(100));
        }

        let actual: string[] = plugin.logs(logName);
        expect(actual.length).toBe(3);
        expect(actual[0]).not.toContain('...');

        await plugin.log(logName, 'info', rand.getString(100));

        actual = plugin.logs(logName);
        expect(actual.length).toBe(3);
        expect(actual[0]).toContain('...');
    });

    it('stores logs only when at or above the specified level', async () => {
        const config = {
            logLevel: 'step',
            maxLogLines: 14
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(new AftConfig({
            HtmlLoggingPluginConfig: config
        }));
        const logName = 'stores logs only when at or above the specified level';
        await plugin.log(logName, 'none', 'level none');
        await plugin.log(logName, 'trace', 'level trace');
        await plugin.log(logName, 'debug', 'level debug');
        await plugin.log(logName, 'info', 'level info');
        await plugin.log(logName, 'step', 'level step');
        await plugin.log(logName, 'warn', 'level warn');
        await plugin.log(logName, 'pass', 'level pass');
        await plugin.log(logName, 'fail', 'level fail');
        await plugin.log(logName, 'error', 'level error');

        let actual: string[] = plugin.logs(logName);
        expect(actual.length).toBe(5);
        expect(actual).not.toContain('level none');
        expect(actual).not.toContain('level trace');
        expect(actual).not.toContain('level debug');
        expect(actual).not.toContain('level info');
    });

    it('can be loaded successfully from the LogManager', async () => {
        const aftCfg = new AftConfig({
            pluginNames: ['html-logging-plugin']
        });
        let logMgr: LogManager = new LogManager('can be loaded successfully from the LogManager', aftCfg);
        let plugin = logMgr.plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('HtmlLoggingPlugin');
    });

    it('only attempts to write to HTML file on call to dispose', async () => {
        const config = {
            outputDir: './',
            fileName: 'testresults.html'
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(new AftConfig({
            HtmlLoggingPluginConfig: config
        }));
        const readSpy = spyOn(plugin, 'logs').and.returnValue(['foo', 'bar', 'baz']);
        const testResults: Array<TestResult> = new Array<TestResult>(
            {testName: 'Fake Test One', testId: 'C123', status: 'failed', resultId: rand.guid, created: Date.now()},
            {testName: 'Fake Test One', testId: 'C234', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake 'Test' Two", testId: 'C345', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake 'Test' Two", testId: 'C456', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake [Test] <Three>", testId: 'Test', status: 'passed', resultId: rand.guid, created: Date.now()}
        );
        for (var res of testResults) {
            await plugin.submitResult(res);
        };
        let actualResults: HtmlResult[];
        const regenSpy = spyOn<any>(plugin, '_regenerateHtmlFile').and.callFake((results: HtmlResult[]) => {
            actualResults = results;
        });

        const logName = 'only attempts to write to sharedCache and HTML file on call to dispose';
        await plugin.log(logName, 'info', 'fake log message');
        const expectedResult: TestResult = {
            testName: logName,
            testId: 'C567', 
            resultId: rand.guid, 
            status: 'passed', 
            created: Date.now()
        };
        await plugin.submitResult(expectedResult);

        expect(regenSpy).not.toHaveBeenCalled();

        await plugin.finalise(logName);

        expect(regenSpy).toHaveBeenCalledTimes(1);
        expect(actualResults).toHaveSize(4);
    });

    it('can generate HTML result file', async () => {
        const config = {
            outputDir: './',
            fileName: 'testresults.html'
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(new AftConfig({
            HtmlLoggingPluginConfig: config
        }));
        const readSpy = spyOn(plugin, 'logs').and.returnValue(['foo', 'bar', 'baz']);
        const testResults: Array<TestResult> = new Array<TestResult>(
            {testName: 'Fake Test One', testId: 'C123', status: 'failed', resultId: rand.guid, created: Date.now()},
            {testName: 'Fake Test One', testId: 'C234', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake 'Test' Two", testId: 'C345', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake 'Test' Two", testId: 'C456', status: 'passed', resultId: rand.guid, created: Date.now()},
            {testName: "Fake [Test] <Three>", status: 'passed', resultId: rand.guid, created: Date.now()}
        );
        for (var res of testResults) {
            await plugin.submitResult(res);
        };

        const logName = 'can generate HTML result file';
        await plugin.log(logName, 'info', 'fake log message');
        const expectedResult: TestResult = {
            testName: logName, 
            testId: 'C567', 
            resultId: rand.guid, 
            status: 'passed', 
            created: Date.now()
        };
        await plugin.submitResult(expectedResult);

        await plugin.finalise(logName);

        expect(fs.existsSync(plugin.fullPathAndFile)).toBeTrue();
    });
});