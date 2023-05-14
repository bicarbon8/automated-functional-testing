import { LoggingPlugin, LogLevel, TestResult, machineInfo, LogManager, LogMessageData, pluginLoader, BuildInfoPlugin, AftConfig, LogManagerConfig, ResultsPlugin } from "aft-core";
import * as AWS from "aws-sdk";
import * as pkg from "../package.json";
import { KinesisLogRecord } from "./kinesis-log-record";

export class KinesisLoggingPluginConfig {
    logLevel: LogLevel;
    region: string;
    deliveryStream: string;
    batch: boolean;
    batchSize: number;
};

type CheckAndSendOptions = {
    override?: boolean;
    logName: string;
};

/**
 * NOTE: this plugin accepts the following options:
 * ```json
 * // aftconfig.json
 * {
 *     "KinesisLoggingPluginConfig": {
 *       "logLevel": "info",
 *       "region": "us-west-1",
 *       "deliveryStream": "your-frehose-delivery-stream",
 *       "batch": true,
 *       "batchSize": 10
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
 * - Options: read from passed in `KinesisLoggingPluginOptions`
 */
export class KinesisLoggingPlugin extends LoggingPlugin implements ResultsPlugin {
    private readonly _logs: Map<string, AWS.Firehose.Record[]>;
    private readonly _buildInfo: BuildInfoPlugin;

    private _client: AWS.Firehose;

    public readonly implements: 'logging';
    public override readonly logLevel: LogLevel;
    public override readonly enabled: boolean;
    
    constructor(aftCfg?: AftConfig, client?: AWS.Firehose) {
        super(aftCfg);
        this._client = client;
        this._logs = new Map<string, AWS.Firehose.Record[]>();
        this.logLevel = this.aftCfg.getSection(KinesisLoggingPluginConfig).logLevel
            ?? this.aftCfg.getSection(LogManagerConfig).logLevel ?? 'warn';
        this.enabled = this.logLevel != 'none';
        if (this.enabled) {
            this._buildInfo = pluginLoader.getPluginsByType(BuildInfoPlugin, this.aftCfg)
                ?.find(p => p?.enabled);
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
        return this.aftCfg.getSection(KinesisLoggingPluginConfig).region;
    }

    get deliveryStream(): string {
        return this.aftCfg.getSection(KinesisLoggingPluginConfig).deliveryStream;
    }

    get batch(): boolean {
        return this.aftCfg.getSection(KinesisLoggingPluginConfig).batch ?? true;
    }

    get batchSize(): number {
        return this.aftCfg.getSection(KinesisLoggingPluginConfig).batchSize ?? 10;
    }

    /**
     * generates a valid AWS Credentials object by checking the following
     * (in this order):
     * - Options: read from passed in `KinesisLoggingPluginOptions`
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
            LogManager.toConsole({name: this.constructor.name, message: e, level: 'warn'});
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
        if (this.enabled) {
            if (!this._logs.has(logName)) {
                this._logs.set(logName, new Array<AWS.Firehose.Record>());
            }
        }
    }

    override log = async (name: string, level: LogLevel, message: string, ...data: Array<any>): Promise<void> => {
        if (this.enabled) {
            if (LogLevel.toValue(level) >= LogLevel.toValue(this.logLevel) && level != 'none') {
                let record: AWS.Firehose.Record = this._createKinesisLogRecord({
                    logName: name,
                    level: level,
                    message: message,
                    version: pkg.version,
                    buildName: await this._buildInfo.buildName().catch((err) => 'unknown'),
                    machineInfo: machineInfo.data
                });
                const logs = this.logs(name);
                logs.push(record);
                this.logs(name, logs);
                await this._checkAndSendLogs({logName: name});
            }
        }
    }

    submitResult = async (result: TestResult): Promise<void> => {
        if (this.enabled) {
            const name = result?.testName;
            if (name) {
                let record: AWS.Firehose.Record = this._createKinesisLogRecord({
                    logName: name,
                    result: result,
                    version: pkg.version,
                    buildName: await this._buildInfo.buildName().catch((err) => 'unknown'),
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
        let data: string = JSON.stringify(logRecord);
        let record: AWS.Firehose.Record = {
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
            let deliveryStream: string = this.deliveryStream;
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
        return await new Promise((resolve, reject) => {
            try {
                let batchInput: AWS.Firehose.PutRecordBatchInput = {
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
        return await new Promise((resolve, reject) => {
            try {
                let input: AWS.Firehose.PutRecordInput = {
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