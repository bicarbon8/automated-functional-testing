import { KinesisLoggingPlugin, KinesisLoggingPluginConfig } from "../src/kinesis-logging-plugin";
import { AftLog, ConfigManager, machineInfo, pluginloader, rand, TestResult } from "aft-core";
import * as pkg from "../package.json";
import * as Firehose from "aws-sdk/clients/firehose";
import { KinesisLogRecord } from "../src/kinesis-log-record";
import AWS = require("aws-sdk");

describe('KinesisLoggingPlugin', () => {
    it('can batch messages for sending', async () => {
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);
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
            await plugin.log({logLevel: 'warn', message: logMessage, name: logName});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(2);
        expect(spySend).toHaveBeenCalledTimes(0);
    });

    it('can disable batch sending of messages', async () => {
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'info';
        config.batch = false
        config.batchSize = 10;
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);
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
            await plugin.log({logLevel: 'warn', message: logMessage, name: rand.getString(10)});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(20);
    });

    it('sends any unsent batched logs on dispose', async () => {
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'info';
        config.batch = true;
        config.batchSize = 10;
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);
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
            await plugin.log({logLevel: 'warn', message: logMessage, name: logName});
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
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);
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

        await plugin.log({logLevel: 'debug', message: rand.guid, name: rand.getString(10)});
        await plugin.log({logLevel: 'info', message: rand.guid, name: rand.getString(10)});
        await plugin.log({logLevel: 'warn', message: rand.guid, name: rand.getString(10)});

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(2);
    });

    it('adds expected fields to the log record', async () => {
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'info';
        config.batch = false;
        config.batchSize = 10;
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);
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
        await plugin.log({logLevel: 'warn', message: expectedMessage, name: 'adds expected fields to the log record'});

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
     * WARNING: this test sends an actual message to the Kinesis logMgr
     * only for use in debugging issues locally
     */
    xit('can send real logs and ITestResult objects', async () => {
        const cfgMgr = new ConfigManager();
        const config = cfgMgr.getSection(KinesisLoggingPluginConfig);
        config.logLevel = 'trace';
        config.batch = true;
        config.batchSize = 10;
        config.deliveryStream = '%kinesis_deliverystream%';
        config.region = '%AWS_REGION%';
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(cfgMgr);

        let result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'Skipped'
        };
        let message: string = rand.getString(250);

        const logName = rand.getString(10, true, true, true, true);
        await plugin.log({logLevel: 'info', message: message, name: logName});
        await plugin.logResult(logName, result);
        await plugin.finalise(logName);
    });

    it('can be loaded by the LogManager', async () => {
        const config = {
            AftConfig: {
                pluginNames: [
                    'kinesis-logging-plugin'
                ]
            },
            KinesisLoggingPluginConfig: {
                logLevel: 'none',
                batch: false
            }
        };
        const cfgMgr = new ConfigManager(config);
        pluginloader.clear();
        const mgr: AftLog = new AftLog(rand.getString(20), cfgMgr);
        const plugins = mgr.plugins;
        const plugin = plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.logLevel).toEqual('none');
        expect((plugin as KinesisLoggingPlugin).batch).toBe(false);
        expect(await (plugin as KinesisLoggingPlugin).client()).toBeDefined();
        expect(plugin.constructor.name).toEqual('KinesisLoggingPlugin');
        expect(plugin.enabled).toBeFalse();
    });
});