import { ReportingPlugin, LogLevel, TestResult, machineInfo, AftConfig, ReportingPluginConfig, LogMessageData, havingProps } from "aft-core";
import * as AWS from "aws-sdk";
import * as pkg from "../package.json";
import { KinesisLogRecord } from "./kinesis-log-record";
import * as date from "date-and-time";

type SendStrategy = 'logsonly' | 'resultsonly' | 'logsandresults';

export class KinesisReportingPluginConfig extends ReportingPluginConfig {
    region: string;
    deliveryStream: string;
    batch = true;
    batchSize = 10;
    sendStrategy: SendStrategy = 'logsandresults';
    timestampFieldName: string = '@timestamp';
    timestampFormat: string = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
}

/**
 * this plugin accepts the following options:
 * ```json
 * // aftconfig.json
 * {
 *     "KinesisReportingPluginConfig": {
 *       "logLevel": "info",
 *       "region": "us-west-1",
 *       "deliveryStream": "your-frehose-delivery-stream",
 *       "batch": true,
 *       "batchSize": 10,
 *       "sendStrategy": "logsandresults",
 *       "timestampFieldName": "@timestamp",
 *       "timestampFormat": "YYYY-MM-DDTHH:mm:ss.SSSZ"
 *     }
 * }
 * ```
 * #### NOTE:
 * > the order we obtain AWS Credentials follows the below:
 * > - Environment Variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
 * > - EC2 Metadata: also known as instance profile credentials
 * > - Shared Ini File: read from the host system
 * > - ECS Credentials: similar to the EC2 Metadata, but on ECS
 * > - Process Credentials: any credentials set on the current process
 */
export class KinesisReportingPlugin extends ReportingPlugin {
    private readonly _logs: Array<AWS.Firehose.Record>;
    private readonly _level: LogLevel;
    private readonly _timestampField: string;
    private readonly _timestampFormat: string;

    private _client: AWS.Firehose;

    public override get logLevel(): LogLevel {
        return this._level;
    }
    
    constructor(aftCfg?: AftConfig, client?: AWS.Firehose) {
        super(aftCfg);
        const krpc = this.aftCfg.getSection(KinesisReportingPluginConfig);
        this._client = client;
        this._logs = new Array<AWS.Firehose.Record>();
        this._level = krpc.logLevel ?? this.aftCfg.logLevel ?? 'warn';
        this._timestampField = krpc.timestampFieldName ?? '@timestamp';
        this._timestampFormat = krpc.timestampFormat ?? 'YYYY-MM-DDTHH:mm:ss.SSSZ'
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

    get logs(): AWS.Firehose.Record[] {
        return this._logs;
    }

    override initialise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        // do nothing
    }

    override log = async (logData: LogMessageData): Promise<void> => {
        if (this.enabled
            && logData?.name != null
            && LogLevel.toValue(logData.level) >= LogLevel.toValue(this.logLevel)
            && logData.level !== 'none'
            && (this.sendStrategy === 'logsandresults' || this.sendStrategy === 'logsonly')) {
            const record: AWS.Firehose.Record = await this._createKinesisLogRecord(logData);
            this.logs.push(record);
            await this._checkAndSendLogs();
        }
    }

    /**
     * implementation of the {ResultsPlugin} class used to submit results
     * @param result a {TestResult} to send to Kinesis Firehose
     */
    override submitResult = async (result: TestResult): Promise<void> => {
        if (this.enabled && result?.testName && (this.sendStrategy === 'logsandresults' || this.sendStrategy === 'resultsonly')) {
            const record: AWS.Firehose.Record = await this._createKinesisLogRecord(result);
            this.logs.push(record);
            await this._checkAndSendLogs();
        }
    }

    override finalise = async (name: string): Promise<void> => { // eslint-disable-line no-unused-vars
        if (this.enabled) {
            while (this.logs.length > 0) {
                // ensure all remaining logs are sent
                await this._checkAndSendLogs(true);
            }
        }
    }

    private async _createKinesisLogRecord(logOrResult: LogMessageData | TestResult): Promise<AWS.Firehose.Record> {
        const data: KinesisLogRecord = {
            version: pkg.version,
            machineInfo: machineInfo.data
        };
        data[this._timestampField] = date.format(new Date(), this._timestampFormat);
        if (havingProps(['name','level','message']).setActual(logOrResult).compare()) {
            data.log = logOrResult as LogMessageData;
        } else {
            data.result = logOrResult as TestResult;
        }
        const dataStr: string = JSON.stringify(data);
        const record: AWS.Firehose.Record = {
            Data: dataStr
        };
        return record;
    }

    private async _checkAndSendLogs(override: boolean = false): Promise<AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput> {
        const batch: boolean = this.batch;
        const batchSize: number = this.batchSize;
        if (override === true || !batch || this.logs.length >= batchSize) {
            let data: AWS.Firehose.PutRecordBatchOutput | AWS.Firehose.PutRecordOutput;
            const deliveryStream: string = this.deliveryStream;
            if (batch) {
                data = await this._sendBatch(deliveryStream, this.logs.splice(0, this.logs.length));
            } else {
                if (this.logs.length > 0) {
                    data = await this._send(deliveryStream, this.logs.splice(0, 1)[0]);
                }
            }
            return data;
        }
        return null;
    }

    private async _sendBatch(deliveryStream: string, records: AWS.Firehose.Record[]): Promise<AWS.Firehose.PutRecordBatchOutput> {
        if (records?.length > 0) {
            const client = await this.client();
            const result: AWS.Firehose.PutRecordBatchOutput = await new Promise((resolve, reject) => {
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
            return result;
        }
        return null;
    }

    private async _send(deliveryStream: string, record: AWS.Firehose.Record): Promise<AWS.Firehose.PutRecordOutput> {
        if (record) {
            const client = await this.client();
            const result: AWS.Firehose.PutRecordOutput = await new Promise((resolve, reject) => {
                try {
                    const input: AWS.Firehose.PutRecordInput = {
                        Record: record,
                        DeliveryStreamName: deliveryStream
                    }
                    client.putRecord(input, (err: AWS.AWSError, data: AWS.Firehose.PutRecordOutput) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
            return result;
        }
        return null;
    }
}
