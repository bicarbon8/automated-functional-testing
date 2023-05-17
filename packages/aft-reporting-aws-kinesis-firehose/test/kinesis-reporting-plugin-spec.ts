import { KinesisReportingPlugin, KinesisReportingPluginConfig } from "../src/kinesis-reporting-plugin";
import { AftConfig, Reporter, machineInfo, pluginLoader, rand, TestResult } from "aft-core";
import * as pkg from "../package.json";
import * as Firehose from "aws-sdk/clients/firehose";
import { KinesisLogRecord } from "../src/kinesis-log-record";
import AWS = require("aws-sdk");

describe('KinesisReportingPlugin', () => {
    it('can batch messages for sending', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        let plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const logName = rand.getString(10);
        for (var i=0; i<20; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log(logName, 'warn', logMessage);
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(2);
        expect(spySend).toHaveBeenCalledTimes(0);
    });

    it('can disable batch sending of messages', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false
        config.batchSize = 10;
        let plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        for (var i=0; i<20; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log(rand.getString(10), 'warn', logMessage);
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(20);
    });

    it('sends any unsent batched logs on dispose', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        let plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        const logName = rand.getString(10);
        for (var i=0; i<9; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log(logName, 'warn', logMessage);
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(9);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(0);

        await plugin.finalise(logName);

        expect(spySendBatch).toHaveBeenCalledTimes(1);
        expect(spySend).toHaveBeenCalledTimes(0);

        expect(plugin.logs(logName).length).toBe(0);
    });

    it('only sends messages of the appropriate level', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        let plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        await plugin.log(rand.getString(10), 'debug', rand.guid);
        await plugin.log(rand.getString(10), 'info', rand.guid);
        await plugin.log(rand.getString(10), 'warn', rand.guid);

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(2);
    });

    it('adds expected fields to the log record', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        let plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        spyOn(plugin, 'credentials').and.returnValue(Promise.resolve(new AWS.Credentials(
            rand.getString(25, true, true),
            rand.getString(35, true, true, true),
            rand.getString(150, true, true, true)
        )));
        const store = new Map<string, any>();
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            store.set('_send', record);
        });

        let expectedMessage: string = rand.guid;
        await plugin.log('adds expected fields to the log record', 'warn', expectedMessage);

        let logRecord: Firehose.Record = store.get('_send');
        let data: KinesisLogRecord = JSON.parse(logRecord.Data.toString()) as KinesisLogRecord;
        expect(data.level).toEqual('warn');
        expect(data.logName).toEqual('adds expected fields to the log record');
        expect(data.message).toEqual(expectedMessage);
        expect(data.machineInfo).toEqual(machineInfo.data);
        expect(data.result).toBeUndefined();
        expect(data.version).toEqual(pkg.version);
    });

    /**
     * WARNING: this test sends an actual message to the Kinesis reporter
     * only for use in debugging issues locally
     */
    xit('can send real logs and ITestResult objects', async () => {
        const cfgMgr = new AftConfig();
        const config = cfgMgr.getSection(KinesisReportingPluginConfig);
        config.logLevel = 'trace';
        config.batch = true;
        config.batchSize = 10;
        config.deliveryStream = '%kinesis_deliverystream%';
        config.region = '%AWS_REGION%';
        const plugin: KinesisReportingPlugin = new KinesisReportingPlugin(cfgMgr);
        const logName = rand.getString(10, true, true, true, true);
        const result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'skipped',
            testName: logName
        };
        const message: string = rand.getString(250);
        await plugin.log(logName, 'info', message);
        await plugin.submitResult(logName, result);
        await plugin.finalise(logName);
    });

    it('can be loaded by the Reporter', async () => {
        const config = {
            AftConfig: {
                pluginNames: [
                    'kinesis-reporting-plugin'
                ]
            },
            KinesisReportingPluginConfig: {
                logLevel: 'none',
                batch: false
            }
        };
        const cfgMgr = new AftConfig(config);
        pluginLoader.reset();
        const mgr: Reporter = new Reporter(rand.getString(20), cfgMgr);
        const plugins = mgr.plugins;
        const plugin = plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.logLevel).toEqual('none');
        expect((plugin as KinesisReportingPlugin).batch).toBe(false);
        expect(await (plugin as KinesisReportingPlugin).client()).toBeDefined();
        expect(plugin.constructor.name).toEqual('KinesisReportingPlugin');
        expect(plugin.enabled).toBeFalse();
    });
});