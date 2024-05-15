import { KinesisReportingPlugin, KinesisReportingPluginConfig } from "../src/kinesis-reporting-plugin";
import { AftConfig, ReportingManager, machineInfo, pluginLoader, rand, TestResult } from "aft-core";
import * as pkg from "../package.json";
import * as Firehose from "aws-sdk/clients/firehose";
import { KinesisLogRecord } from "../src/kinesis-log-record";
import AWS = require("aws-sdk");

describe('KinesisReportingPlugin', () => {
    beforeEach(() => {
        pluginLoader.reset();
    });
    afterEach(() => {
        pluginLoader.reset();
    });

    it('can batch messages for sending', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        for (let i=0; i<20; i++) {
            const message: string = rand.getString(99, true, true);
            await plugin.log({name, level: 'warn', message});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(2);
        expect(spySend).toHaveBeenCalledTimes(0);
    });

    it('can disable batch sending of messages', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false
        config.batchSize = 10;
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        for (let i=0; i<20; i++) {
            const message: string = rand.getString(99, true, true);
            await plugin.log({name, level: 'warn', message});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(20);
    });

    it('sends any unsent batched logs on dispose', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        for (let i=0; i<9; i++) {
            const message: string = rand.getString(99, true, true);
            await plugin.log({name, level: 'warn', message});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(9);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(0);

        await plugin.finalise(name);

        expect(spySendBatch).toHaveBeenCalledTimes(1);
        expect(spySend).toHaveBeenCalledTimes(0);

        expect(plugin.logs.length).toBe(0);
    });

    it('only sends messages of the appropriate level', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        await plugin.log({name, level: 'debug', message: rand.guid});
        await plugin.log({name, level: 'info', message: rand.guid});
        await plugin.log({name, level: 'warn', message: rand.guid});

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(2);
    });

    it('can disable log messages and only send results', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        config.sendStrategy = 'resultsonly';
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        await plugin.log({name, level: 'debug', message: rand.guid});
        await plugin.log({name, level: 'info', message: rand.guid});
        await plugin.log({name, level: 'warn', message: rand.guid});

        expect(spyCheckAndSendLogs).not.toHaveBeenCalled();
        expect(spySendBatch).not.toHaveBeenCalled();
        expect(spySend).not.toHaveBeenCalled();

        const result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'skipped',
            testName: name
        };
        await plugin.submitResult(result);

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(1);
        expect(spySend).toHaveBeenCalledTimes(1);
    });

    it('can disable results and only send log messages', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        config.sendStrategy = 'logsonly';
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        const spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        const spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const name = rand.getString(10);

        await plugin.log({name, level: 'debug', message: rand.guid});
        await plugin.log({name, level: 'info', message: rand.guid});
        await plugin.log({name, level: 'warn', message: rand.guid});

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2);
        expect(spySendBatch).not.toHaveBeenCalled();
        expect(spySend).toHaveBeenCalledTimes(2);

        const result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'skipped',
            testName: name
        };
        await plugin.submitResult(result);

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2); // no additional times
        expect(spySend).toHaveBeenCalledTimes(2); // no additional times
    });

    it('adds expected fields to the log record', async () => {
        const aftCfg = new AftConfig();
        const config = aftCfg.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const store = new Map<string, any>();
        spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            store.set('_send', record);
        });

        const message: string = rand.guid;
        const name = 'adds expected fields to the log record';

        await plugin.log({name, level: 'warn', message});

        const logRecord: Firehose.Record = store.get('_send');
        const data: KinesisLogRecord = JSON.parse(logRecord.Data.toString()) as KinesisLogRecord;
        expect(data.created).toMatch(/[0-9]+/);
        expect(data.version).toEqual(pkg.version);
        expect(data.machineInfo).toEqual(machineInfo.data);
        expect(data.log).toBeDefined();
        expect(data.log.level).toEqual('warn');
        expect(data.log.name).toEqual(name);
        expect(data.log.message).toEqual(message);
        expect(data.result).toBeUndefined();
    });

    /**
     * WARNING: this test sends an actual message to the Kinesis reporter
     * only for use in debugging issues locally
     */
    xit('can send real logs and TestResult objects', async () => {
        const aftCfg = new AftConfig({
            KinesisReportingPluginConfig: {
                batch: false,
                deliveryStream: '%firehose_deliverystream%',
                logLevel: 'debug',
                sendStrategy: 'logsandresults',
                region: 'eu-west-1'
            }
        });
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(aftCfg);
        const name = rand.getString(10, true, true, true, true);
        const result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'skipped',
            testName: name
        };
        const message: string = rand.getString(250);

        await plugin.log({name, level: 'info', message});
        await plugin.submitResult(result);
        await plugin.finalise(name);
    }, 20000);

    it('can be loaded by the ReportingManager', async () => {
        const config = {
            plugins: [
                'kinesis-reporting-plugin'
            ],
            KinesisReportingPluginConfig: {
                logLevel: 'error',
                batch: false
            }
        };
        const aftCfg = new AftConfig(config);
        pluginLoader.reset();
        const mgr: ReportingManager = new ReportingManager(rand.getString(20), aftCfg);
        const plugins = mgr.plugins;
        const plugin = plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.logLevel).toEqual('error');
        expect((plugin as KinesisReportingPlugin).batch).toBe(false);
        expect(plugin.constructor.name).toEqual('KinesisReportingPlugin');
        expect(plugin.enabled).toBeTrue();
    });
});
