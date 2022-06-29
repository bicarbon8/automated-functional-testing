import { KinesisLoggingPlugin, KinesisLoggingPluginOptions } from "../src/kinesis-logging-plugin";
import { LogManager, LogManagerOptions, machineInfo, pluginloader, rand, TestResult } from "aft-core";
import * as pkg from "../package.json";
import * as Firehose from "aws-sdk/clients/firehose";
import { KinesisLogRecord } from "../src/kinesis-log-record";

describe('KinesisLoggingPlugin', () => {
    it('can batch messages for sending', async () => {
        const config: KinesisLoggingPluginOptions = {
            level: 'info',
            batch: true,
            batchSize: 10,
            accessKeyId: rand.getString(20),
            secretAccessKey: rand.getString(50)
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        for (var i=0; i<20; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log({level: 'warn', message: logMessage, name: rand.getString(10)});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(2);
        expect(spySend).toHaveBeenCalledTimes(0);
    });

    it('can disable batch sending of messages', async () => {
        const config: KinesisLoggingPluginOptions = {
            level: 'info',
            batch: false,
            batchSize: 10,
            accessKeyId: rand.getString(20),
            secretAccessKey: rand.getString(50)
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        for (var i=0; i<20; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log({level: 'warn', message: logMessage, name: rand.getString(10)});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(20);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(20);
    });

    it('sends any unsent batched logs on dispose', async () => {
        const config: KinesisLoggingPluginOptions = {
            level: 'info',
            batch: true,
            batchSize: 10,
            accessKeyId: rand.getString(20),
            secretAccessKey: rand.getString(50)
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        for (var i=0; i<9; i++) {
            let logMessage: string = rand.getString(99, true, true);
            await plugin.log({level: 'warn', message: logMessage, name: rand.getString(10)});
        }

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(9);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(0);

        await plugin.dispose(rand.getString(10));

        expect(spySendBatch).toHaveBeenCalledTimes(1);
        expect(spySend).toHaveBeenCalledTimes(0);
    });

    it('only sends messages of the appropriate level', async () => {
        const config: KinesisLoggingPluginOptions = {
            level: 'info',
            batch: false,
            batchSize: 10,
            accessKeyId: rand.getString(20),
            secretAccessKey: rand.getString(50)
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);
        let spyCheckAndSendLogs = spyOn<any>(plugin, '_checkAndSendLogs').and.callThrough();
        let spySendBatch = spyOn<any>(plugin, '_sendBatch').and.callFake((deliveryStream: string, records: Firehose.Record[]) => {
            /* do nothing */
        });
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            /* do nothing */
        });

        await plugin.log({level: 'debug', message: rand.guid, name: rand.getString(10)});
        await plugin.log({level: 'info', message: rand.guid, name: rand.getString(10)});
        await plugin.log({level: 'warn', message: rand.guid, name: rand.getString(10)});

        expect(spyCheckAndSendLogs).toHaveBeenCalledTimes(2);
        expect(spySendBatch).toHaveBeenCalledTimes(0);
        expect(spySend).toHaveBeenCalledTimes(2);
    });

    it('adds expected fields to the log record', async () => {
        const config: KinesisLoggingPluginOptions = {
            level: 'info',
            batch: false,
            batchSize: 10,
            accessKeyId: rand.getString(20),
            secretAccessKey: rand.getString(50)
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);
        const store = new Map<string, any>();
        let spySend = spyOn<any>(plugin, '_send').and.callFake((deliveryStream: string, record: Firehose.Record) => {
            store.set('_send', record);
        });

        let expectedMessage: string = rand.guid;
        await plugin.log({level: 'warn', message: expectedMessage, name: 'adds expected fields to the log record'});

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
        const config: KinesisLoggingPluginOptions = {
            level: 'trace',
            batch: true,
            batchSize: 10,
            accessKeyId: '%AWS_ACCESS_KEY_ID%',
            secretAccessKey: '%AWS_SECRET_ACCESS_KEY%',
            sessionToken: '%AWS_SESSION_TOKEN',
            deliveryStream: '%kinesis_deliverystream%',
            region: '%AWS_REGION%'
        };
        let plugin: KinesisLoggingPlugin = new KinesisLoggingPlugin(config);

        let result: TestResult = {
            resultId: rand.guid,
            created: Date.now(),
            testId: 'C' + rand.getInt(100, 9999),
            resultMessage: rand.getString(100),
            status: 'Skipped'
        };
        let message: string = rand.getString(250);

        const logName = rand.getString(10, true, true, true, true);
        await plugin.log({level: 'info', message: message, name: logName});
        await plugin.logResult(logName, result);
        await plugin.dispose(logName);
    });

    it('can be loaded by the LogManager', async () => {
        const config: LogManagerOptions = {
            logName: 'can be loaded by the LogManager',
            plugins: [{
                name: 'kinesis-logging-plugin',
                options: {
                    batch: false,
                    batchSize: 0,
                    level: 'error',
                    accessKeyId: rand.getString(20),
                    secretAccessKey: rand.getString(50),
                    enabled: false
                } as KinesisLoggingPluginOptions
            }]
        };
        pluginloader.clear();
        const mgr: LogManager = new LogManager(config);
        const plugins = await mgr.plugins();
        const plugin = plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.level).toEqual('error');
        expect((plugin as KinesisLoggingPlugin).batch).toBe(false);
        expect(await (plugin as KinesisLoggingPlugin).client()).toBeDefined();
        expect(plugin.constructor.name).toEqual('KinesisLoggingPlugin');
        expect(plugin.enabled).toBeFalse();
    }, 25000);
});