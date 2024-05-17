import { ReportingPlugin, LogLevel, TestResult, machineInfo, AftConfig, ReportingPluginConfig, LogMessageData, havingProps, rand } from "aft-core";
import * as AWS from "aws-sdk";
import * as pkg from "../package.json";
import { KinesisLogRecord } from "./kinesis-log-record";
import * as date from "date-and-time";

type SendStrategy = 'logsonly' | 'resultsonly' | 'logsandresults';

export class KinesisReportingPluginConfig extends ReportingPluginConfig {
    /**
     * the AWS region where your Kinesis Firehose instance exists
     */
    region: string;
    /**
     * the AWS Firehose delivery stream to use
     */
    deliveryStream: string;
    /**
     * a `boolean` indicating if messages should be batched
     * before sending. set to `false` to disable batching
     * @default true
     */
    batch = true;
    /**
     * the number of messages to batch before sending
     */
    batchSize = 10;
    /**
     * a value of `logsonly`, `resultsonly`, or `logsandresults`
     * indicating if only logs, only results or both should be
     * sent
     * @default 'logsandresults'
     */
    sendStrategy: SendStrategy = 'logsandresults';
    /**
     * within the Data being sent, a valid timestamp is required; this
     * allows you to override the field name used for the timestamp
     * to match any non-standard values you might already be using
     * @default '@timestamp'
     */
    timestampFieldName: string = '@timestamp';
    /**
     * the timestamp format to use
     * @default 'YYYY-MM-DDT:HH:mm:ss.SSSZ'
     */
    timestampFormat: string = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    /**
     * an optional AWS IAM role to assume that will allow you to send
     * results to your Firehose instance if the default role obtained
     * does not already do so
     */
    assumeRoleArn: string;
    /**
     * an optional duration for the assumed role to remain valid
     * @default 900
     */
    assumeRoleDuration: number = 900;
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
 *       "assumeRoleArn": "optional-arn-for-iam-role-used-to-send-records",
 *       "assumeRoleDuration": 900,
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
    private readonly _assumeRoleArn: string;
    private readonly _assumeRoleDuration: number;

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
        this._timestampFormat = krpc.timestampFormat ?? 'YYYY-MM-DDTHH:mm:ss.SSSZ';
        this._assumeRoleArn = krpc.assumeRoleArn;
        this._assumeRoleDuration = krpc.assumeRoleDuration ?? 900;
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
            this.aftLogger.log({level: 'trace', message: 'attempting to obtain AWS Credentials...'});
            creds = await new AWS.CredentialProviderChain([
                () => new AWS.EnvironmentCredentials('AWS'),
                () => new AWS.EC2MetadataCredentials(),
                () => new AWS.SharedIniFileCredentials(),
                () => new AWS.ECSCredentials(),
                () => new AWS.ProcessCredentials()
            ]).resolvePromise();
            this.aftLogger.log({level: 'trace', message: 'successfully obtained credentials'});
            // assume specified role if appropriate
            creds = await this._assumeRoleIfNeeded(creds);
        } catch (e) {
            this.aftLogger.log({ name: this.constructor.name, message: e, level: 'warn' });
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
        if (havingProps(['name', 'level', 'message']).setActual(logOrResult).compare()) {
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
            this.aftLogger.log({
                level: 'trace',
                message: `attempting to send ${records.length} batched records to AWS Firehose deliverystream '${deliveryStream}'...`,
                data: records
            });
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
            this.aftLogger.log({level: 'trace', message: `successfully sent ${records.length} records to AWS Firehose`});
            return result;
        }
        return null;
    }

    private async _send(deliveryStream: string, record: AWS.Firehose.Record): Promise<AWS.Firehose.PutRecordOutput> {
        if (record) {
            const client = await this.client();
            this.aftLogger.log({
                level: 'trace',
                message: `attempting to send non-batched record to AWS Firehose deliverystream '${deliveryStream}'...`,
                data: [record]
            });
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
            this.aftLogger.log({level: 'trace', message: `successfully sent record to AWS Firehose`});
            return result;
        }
        return null;
    }

    private async _assumeRoleIfNeeded(credentials: AWS.Credentials): Promise<AWS.Credentials> {
        // no assumeRole needed so return original credentials
        if (this._assumeRoleArn == null) {
            return credentials;
        }
        this.aftLogger.log({level: 'trace', message: `attempting to assume role '${this._assumeRoleArn}'...`});
        const roleToAssume: AWS.STS.AssumeRoleRequest = {
            RoleArn: this._assumeRoleArn,
            RoleSessionName: rand.guid,
            DurationSeconds: this._assumeRoleDuration,
        };
        // Create the STS service object
        const sts = new AWS.STS({ apiVersion: "2011-06-15", credentials });
        // Assume Role and return new Credentials
        const creds = await new Promise<AWS.Credentials>((resolve, reject) => {
            sts.assumeRole(roleToAssume, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(new AWS.Credentials({
                        accessKeyId: data.Credentials.AccessKeyId,
                        secretAccessKey: data.Credentials.SecretAccessKey,
                        sessionToken: data.Credentials.SessionToken,
                    }));
                }
            });
        });
        this.aftLogger.log({level: 'trace', message: `successfully assumed role.`});
        return creds;
    }
}
