# AFT-reporting-AWSKinesis
an Automated Functional Testing (AFT) library providing logging to an AWS Kinesis Firehose endpoint for any `TestResult` objects logged via the `aft-core.ReportingManager`

## Installation
`> npm i aft-reporting-awskinesis`

## Configuration
to send values to AWS Kinesis Firehose endpoints you must specify the AWS Credentials, the AWS Region Endpoint and the AWS Kinesis Delivery Stream. These take the following form in your `aftconfig.json`:
```json
{
    "plugins": [
      {"name": "kinesis-reporting-plugin", "searchDir": "./node_modules/"}
    ],
    "KinesisReportingPluginConfig": {
        "logLevel": "info",
        "region": "us-west-1",
        "deliveryStream": "your-frehose-delivery-stream",
        "batch": true,
        "batchSize": 10,
        "sendStrategy": "logsandresults"
    }
}
```
- **logLevel** - an optional `LogLevel` to be used by this plugin _(defaults to value set in `AftConfig.logLevel` or `warn` if unset)_
- **region** - a `string` containing the AWS region where the Kinesis Firehose stream is located. values like `eu-west-1` or `us-west-2` are expected.
- **deliveryStream** - a `string` containing the name of the Kinesis Firehose stream to send through. If using Elasticsearch as your back-end storage, this would be the Elasticsearch index to use.
- **batch** - an optional `boolean` indicating whether logs should be batched before forwarding to Kinesis Firehose _(defaults to `true`)_
- **batchSize** - an optional `number` representing the number of log records to batch before sending _(defaults to 10)_
- **sendStrategy** - an optional `string` of `logsandresults`, `logsonly` or `resultsonly` that controls sending of log messages and results _(defaults to `logsandresults`)_

#### NOTE:
> the AWS Credentials are first attempted to be read from AFT Configuration and if no value is specified then the following are checked:
> - Environment Variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
> - EC2 Metadata: also known as instance profile credentials
> - Shared Ini File: read from the host system
> - ECS Credentials: similar to the EC2 Metadata, but on ECS
> - Process Credentials: any credentials set on the current process

## Format of log records
the log record that is sent to your AWS Kinesis Firehose endpoint will have the following format:
### message logs
```JSON
{
    "created": 1655289028279,
    "version": "11.2.1",
    "machineInfo": {
        "ip": "234.9.10.11",
        "name": "CETH-ARG-WIN10",
        "user": "SYSTEM"
    },
    "log": {
        "name": "if used with an AftTest this will be the 'description' or 'Test IDs' or a GUID",
        "level": "warn",
        "message": "this is the actual message being logged",
        "data": [
            "an array of optional values",
            {"foo": "bar", "baz": true}
        ]
    }
}
```
- **created** - the elapsed milliseconds since the epoch representing when this log record was created
- **version** - the current version of the `KinesisReportingPlugin`
- **machineInfo** - an `aft-core.MachineInfoData` object containing the following:
    - **ip** - a `string` of the machine's IP address
    - **name** - a `string` of the machine's name
    - **user** - a `string` of the currently logged in user who executed the tests
- **log** - the `LogMessageData` object
    - **name** - the `name` passed to this plugin when loaded from the `ReportingManager`
    - **level** - a `string` value from one of the `aft-core.LoggingLevel` values based on the level of the message being logged
    - **message** - the `string` being logged by some component
    - **data** - an `array` of anything added to the log function call after the message

### `TestResult` logs
```JSON
{
    "created": 1655289028279,
    "version": "11.2.1",
    "machineInfo": {
        "ip": "234.9.10.11",
        "name": "CETH-ARG-WIN10",
        "user": "SYSTEM"
    },
    "result": {
        "created": 1655289028270,
        "testName": "this is the description from your test",
        "testId": "1234",
        "resultMessage": "the final result was a SUCCESS!",
        "status": "passed",
        "resultId": "dbbf6fce-14db-4bd2-ba31-e3fa68d719e4",
        "metadata": {
            "durationMs": 12345,
            "buildName": "Test Build",
            "buildNumber": "23",
        }
    }
}
```
- **created** - the elapsed milliseconds since the epoch representing when this log record was created
- **version** - the current version of the `KinesisReportingPlugin`
- **machineInfo** - an `aft-core.MachineInfoData` object containing the following:
    - **ip** - a `string` of the machine's IP address
    - **name** - a `string` of the machine's name
    - **user** - a `string` of the currently logged in user who executed the tests
- **result** - an `TestResult` object containing the following:
  - **created** - a `number` representing the elapsed milliseconds since the epoch for when this result was created
  - **testId** - a `string` containing any unique ID for the test result being recorded
  - **resultMessage** - a `string` message of the final result
  - **status** - a `string` representing the `aft-core.TestStatus` value
  - **resultId** - a `string` containing a unique identifier for the `TestResult`
  - **created** - a `number` containing the date and time the `TestResult` was created as milliseconds since the epoch
  - **metadata** - an `object` that can contain additional data for the `TestResult`
