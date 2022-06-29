import { LoggingPlugin, LogLevel, TestResult, machineInfo, BuildInfoManager, buildinfo, LogManager, LogMessageData, TestException, Merge, LoggingPluginOptions } from "aft-core";
import * as AWS from "aws-sdk";
import * as pkg from "../package.json";
import { KinesisLogRecord } from "./kinesis-log-record";

export type KinesisLoggingPluginOptions = Merge<LoggingPluginOptions, {
    accessKeyId?: string,
    secretAccessKey?: string,
    sessionToken?: string,
    region?: string,
    deliveryStream?: string,
    batch?: boolean;
    batchSize?: number;

    client?: AWS.Firehose;
    buildInfoMgr?: BuildInfoManager;
}>;

/**
 * NOTE: this plugin accepts the following options:
 * ```json
 * {
 *   "level": "info",
 *   "accessKeyId": "your-aws-access-key-id",
 *   "secretAccessKey": "your-aws-secret-access-key",
 *   "sessionToken": "your-aws-session-token",
 *   "region": "us-west-1",
 *   "deliveryStream": "your-frehose-delivery-stream"
 *   "batch": true,
 *   "batchSize": 10
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
export class KinesisLoggingPlugin extends LoggingPlugin<KinesisLoggingPluginOptions> {
    private readonly _logs: AWS.Firehose.Record[];
    private readonly _buildInfoMgr: BuildInfoManager;

    private _client: AWS.Firehose;
    
    constructor(options?: KinesisLoggingPluginOptions) {
        super(options);
        this._logs = [];
        this._buildInfoMgr = this.option('buildInfoMgr', buildinfo);
        this._client = this.option('client'); // new client created if not passed in
    }

    async client(): Promise<AWS.Firehose> {
        if (!this._client) {
            this._client = this.option('client') || new AWS.Firehose({
                region: this.region,
                credentials: await this.credentials()
            });
        }
        return this._client;
    }

    get accessKeyId(): string {
        return this.option('accessKeyId');
    }

    get secretAccessKey(): string {
        return this.option('secretAccessKey');
    }

    get sessionToken(): string {
        return this.option('sessionToken');
    }

    get region(): string {
        return this.option('region');
    }

    get deliveryStream(): string {
        return this.option('deliveryStream');
    }

    get batch(): boolean {
        return this.option('batch', true);
    }

    get batchSize(): number {
        return this.option('batchSize', 10);
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
        if (this.accessKeyId && this.secretAccessKey) {
            creds = new AWS.Credentials({
                accessKeyId: this.accessKeyId, 
                secretAccessKey: this.secretAccessKey,
                sessionToken: this.sessionToken
            });
        }
        if (!creds) {
            creds = await new AWS.CredentialProviderChain([
                () => new AWS.EnvironmentCredentials('AWS'),
                () => new AWS.EC2MetadataCredentials(),
                () => new AWS.SharedIniFileCredentials(),
                () => new AWS.ECSCredentials(),
                () => new AWS.ProcessCredentials()
            ]).resolvePromise()
            .catch((err) => {
                LogManager.toConsole({name: this.constructor.name, message: err, level: 'warn'});
                return null;
            });    
        }
        return creds;
    }

    override async log(data: LogMessageData): Promise<void> {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.level) && data.level != 'none') {
            let record: AWS.Firehose.Record = this._createKinesisLogRecord({
                logName: data.name,
                level: data.level,
                message: data.message,
                version: pkg.version,
                buildName: await this._buildInfoMgr.buildName().catch((err) => 'unknown'),
                machineInfo: machineInfo.data
            });
            this._logs.push(record);
            await this._checkAndSendLogs();
        }
    }

    override async logResult(name: string, result: TestResult): Promise<void> {
        let record: AWS.Firehose.Record = this._createKinesisLogRecord({
            logName: name,
            result: result,
            version: pkg.version,
            buildName: await this._buildInfoMgr.buildName().catch((err) => 'unknown'),
            machineInfo: machineInfo.data
        });
        this._logs.push(record);
        await this._checkAndSendLogs();
    }

    override async dispose(name: string, error?: Error): Promise<void> {
        if (error) {
            await this.log({name: name, level: 'error', message: TestException.short(error)});
        }
        // ensure all remaining logs are sent
        await this._checkAndSendLogs({override: true});
    }

    private _createKinesisLogRecord(logRecord: KinesisLogRecord): AWS.Firehose.Record {
        let data: string = JSON.stringify(logRecord);
        let record: AWS.Firehose.Record = {
            Data: data
        };
        return record;
    }

    private async _checkAndSendLogs(override?: {override: boolean}): Promise<AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput> {
        const batch: boolean = this.batch;
        const batchSize: number = this.batchSize;
        if (override?.override || !batch || this._logs.length >= batchSize) {
            let data: AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput;
            let deliveryStream: string = this.deliveryStream;
            if (batch) {
                data = await this._sendBatch(deliveryStream, this._logs);
            } else {
                data = await this._send(deliveryStream, this._logs[0]);
            }
            this._logs.splice(0, this._logs.length); // empties the array
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