import { ReportingPlugin, LogLevel, TestResult, machineInfo, AftConfig, BuildInfoManager, ReportingPluginConfig, Err } from "aft-core";
import * as AWS from "aws-sdk";
import * as pkg from "../package.json";
import { KinesisLogRecord } from "./kinesis-log-record";

type CheckAndSendOptions = {
    override?: boolean;
    logName: string;
};

type SendStrategy = 'logsonly' | 'resultsonly' | 'logsandresults';

export class KinesisReportingPluginConfig extends ReportingPluginConfig {
    region: string;
    deliveryStream: string;
    batch = true;
    batchSize = 10;
    sendStrategy: SendStrategy = 'logsandresults';
}

/**
 * NOTE: this plugin accepts the following options:
 * ```json
 * // aftconfig.json
 * {
 *     "KinesisReportingPluginConfig": {
 *       "logLevel": "info",
 *       "region": "us-west-1",
 *       "deliveryStream": "your-frehose-delivery-stream",
 *       "batch": true,
 *       "batchSize": 10,
 *       "sendStrategy": "logsandresults"
 *     }
 * }
 * ```
 * NOTE:
 * the order we obtain AWS Credentials follows the below:
 * - Environment Variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
 * - EC2 Metadata: also known as instance profile credentials
 * - Shared Ini File: read from the host system
 * - ECS Credentials: similar to the EC2 Metadata, but on ECS
 * - Process Credentials: any credentials set on the current process
 */
export class KinesisReportingPlugin extends ReportingPlugin {
    private readonly _logs: Map<string, AWS.Firehose.Record[]>;
    private readonly _buildInfo: BuildInfoManager;
    private readonly _level: LogLevel;

    private _client: AWS.Firehose;

    public override get logLevel(): LogLevel {
        return this._level;
    }
    
    constructor(aftCfg?: AftConfig, client?: AWS.Firehose) {
        super(aftCfg);
        this._client = client;
        this._logs = new Map<string, AWS.Firehose.Record[]>();
        this._level = this.aftCfg.getSection(KinesisReportingPluginConfig).logLevel
            ?? this.aftCfg.logLevel ?? 'warn';
        if (this.enabled) {
            this._buildInfo = new BuildInfoManager(this.aftCfg);
        }
    }

    async client(): Promise<AWS.Firehose> {
        if (!this._client) {
            this._client = new AWS.Firehose({
                region: this.region,
                credentials: await this.credentials()
            });
        }
        return this._client;
    }

    get region(): string {
        return this.aftCfg.getSection(KinesisReportingPluginConfig).region;
    }

    get deliveryStream(): string {
        return this.aftCfg.getSection(KinesisReportingPluginConfig).deliveryStream;
    }

    get batch(): boolean {
        return this.aftCfg.getSection(KinesisReportingPluginConfig).batch ?? true;
    }

    get batchSize(): number {
        return this.aftCfg.getSection(KinesisReportingPluginConfig).batchSize ?? 10;
    }

    get sendStrategy(): SendStrategy {
        return this.aftCfg.getSection(KinesisReportingPluginConfig).sendStrategy ?? 'logsandresults';
    }

    /**
     * generates a valid AWS Credentials object by checking the following
     * (in this order):
     * - Options: read from passed in `KinesisReportingPluginOptions`
     * - Environment Variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
     * - EC2 Metadata: also known as instance profile credentials
     * - Shared Ini File: read from the host system
     * - ECS Credentials: similar to the EC2 Metadata, but on ECS
     * - Process Credentials: any credentials set on the current process
     * @returns a valid AWS Credentials object
     */
    async credentials(): Promise<AWS.Credentials> {
        let creds: AWS.Credentials;
        try {
            creds = await new AWS.CredentialProviderChain([
                () => new AWS.EnvironmentCredentials('AWS'),
                () => new AWS.EC2MetadataCredentials(),
                () => new AWS.SharedIniFileCredentials(),
                () => new AWS.ECSCredentials(),
                () => new AWS.ProcessCredentials()
            ]).resolvePromise();    
        } catch (e) {
            this.aftLogger.log({name: this.constructor.name, message: e, level: 'warn'});
            return null;
        }
        return creds;
    }

    logs(key: string, val?: AWS.Firehose.Record[]): AWS.Firehose.Record[] {
        if (val) {
            this._logs.set(key, val);
        }
        return this._logs.get(key);
    }

    override initialise = async (logName: string): Promise<void> => {
        if (this.enabled && !this._logs.has(logName)) {
            this._logs.set(logName, new Array<AWS.Firehose.Record>());
        }
    }

    override log = async (name: string, level: LogLevel, message: string, ...data: Array<any>): Promise<void> => {
        if (this.enabled
            && LogLevel.toValue(level) >= LogLevel.toValue(this.logLevel)
            && level !== 'none'
            && (this.sendStrategy === 'logsandresults' || this.sendStrategy === 'logsonly')) {
            const dataStr = (data?.length) ? `, [${data?.map(d => {
                const dHandled = Err.handle(() => JSON.stringify(d));
                return dHandled.result ?? dHandled.message;
            }).join(', ')}]` : '';
            const record: AWS.Firehose.Record = this._createKinesisLogRecord({
                logName: name,
                level,
                message: `${message}${dataStr}`,
                version: pkg.version,
                buildName: await this._buildInfo.buildName().catch(() => 'unknown'),
                machineInfo: machineInfo.data
            });
            const logs = this.logs(name);
            logs.push(record);
            this.logs(name, logs);
            await this._checkAndSendLogs({logName: name});
        }
    }

    /**
     * implementation of the {ResultsPlugin} class used to submit results
     * @param result a {TestResult} to send to Kinesis Firehose
     */
    override submitResult = async (name: string, result: TestResult): Promise<void> => {
        if (this.enabled && (this.sendStrategy === 'logsandresults' || this.sendStrategy === 'resultsonly')) {
            name ??= result?.testName;
            if (name) {
                const record: AWS.Firehose.Record = this._createKinesisLogRecord({
                    logName: name,
                    result,
                    version: pkg.version,
                    buildName: await this._buildInfo.buildName().catch(() => 'unknown'),
                    machineInfo: machineInfo.data
                });
                const logs = this.logs(name);
                logs.push(record);
                this.logs(name, logs);
                await this._checkAndSendLogs({logName: name});
            }
        }
    }

    override finalise = async (name: string): Promise<void> => {
        if (this.enabled) {
            // ensure all remaining logs are sent
            await this._checkAndSendLogs({override: true, logName: name});
        }
    }

    private _createKinesisLogRecord(logRecord: KinesisLogRecord): AWS.Firehose.Record {
        const data: string = JSON.stringify(logRecord);
        const record: AWS.Firehose.Record = {
            Data: data
        };
        return record;
    }

    private async _checkAndSendLogs(options: CheckAndSendOptions): Promise<AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput> {
        const batch: boolean = this.batch;
        const batchSize: number = this.batchSize;
        const logs = this.logs(options.logName);
        if (options?.override || !batch || logs.length >= batchSize) {
            let data: AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput;
            const deliveryStream: string = this.deliveryStream;
            if (batch) {
                data = await this._sendBatch(deliveryStream, logs);
            } else {
                data = await this._send(deliveryStream, logs[0]);
            }
            logs.splice(0, logs.length); // empties the array
            this.logs(options.logName, logs);
            return data;
        }
        return null;
    }

    private async _sendBatch(deliveryStream: string, records: AWS.Firehose.Record[]): Promise<AWS.Firehose.PutRecordBatchOutput> {
        const client = await this.client();
        return new Promise((resolve, reject) => {
            try {
                const batchInput: AWS.Firehose.PutRecordBatchInput = {
                    Records: records,
                    DeliveryStreamName: deliveryStream
                };
                client.putRecordBatch(batchInput, (err: AWS.AWSError, data: AWS.Firehose.PutRecordBatchOutput) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private async _send(deliveryStream: string, record: AWS.Firehose.Record): Promise<AWS.Firehose.PutRecordOutput> {
        const client = await this.client();
        return new Promise((resolve, reject) => {
            try {
                const input: AWS.Firehose.PutRecordInput = {
                    Record: record,
                    DeliveryStreamName: deliveryStream
                }
                client.putRecord(input, (err: AWS.AWSError, data: AWS.Firehose.PutRecordOutput) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
