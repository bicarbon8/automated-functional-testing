# AFT-reporting-AWSKinesis
an Automated Functional Testing (AFT) library providing logging to an AWS Kinesis Firehose endpoint for any `TestResult` objects logged via the `aft-core.Reporter`

## Installation
`> npm i aft-reporting-awskinesis`

## Configuration
to send values to AWS Kinesis Firehose endpoints you must specify the AWS Credentials, the AWS Region Endpoint and the AWS Kinesis Delivery Stream. These take the following form in your `aftconfig.json`:
```json
{
  "Reporter": {
    "level": "none",
    "plugins": [{
      "name": "kinesis-reporting-plugin",
      "searchDirectory": "../",
      "options": {
        "enabled": true,
        "level": "info",
        "accessKeyId": "your-aws-access-key-id",
        "secretAccessKey": "your-aws-secret-access-key",
        "sessionToken": "your-aws-session-token",
        "region": "us-west-1",
        "deliveryStream": "your-frehose-delivery-stream",
        "batch": false,
        "batchSize": 1
      }
    }]
  }
}
```
- **name** - a `string` containing `kinesis-reporting-plugin` instructing the `pluginloader` to load this plugin
- **searchDirectory** - an optional `string` containing the root directory to begin searching for this plugin when first attempting to load it _(defaults to current working directory)_
- **options** - an optional `object` containing options for the plugin when it is first loaded. accepted values are as follows:
  - **enabled** - an optional `boolean` indicating if this plugin should be used or not _(defaults to `true`)_
  - **level** - an optional `LogLevel` to be used by this plugin _(defaults to value set in `Reporter`)_
  - **accessKeyId** - a `string` containing your AWS IAM user's Access Key ID. if not specified the value will attempt to be read from environment variables, EC2 metadata, shared ini file, ECS credentials and process credentials in that order
  - **secretAccessKey** - a `string` containing your AWS IAM user's Secret Access Key. if not specified the value will attempt to be read like `accessKeyId`
  - **sessionToken** - a `string` containing your AWS IAM user's Session Token. only required if you are using a temporary session. if not specified the value will attempt to be read like `accessKeyId`
  - **region** - a `string` containing the AWS region where the Kinesis Firehose stream is located. values like `eu-west-1` or `us-west-2` are expected.
  - **deliveryStream** - a `string` containing the name of the Kinesis Firehose stream to send through. If using Elasticsearch as your back-end storage, this would be the Elasticsearch index to use.
  - **batch** - an optional `boolean` indicating whether logs should be batched before forwarding to Kinesis Firehose _(defaults to `true`)_
  - **batchSize** - an optional `number` representing the number of log records to batch before sending _(defaults to 10)_

> NOTE: the AWS Credentials are first attempted to be read from AFT Configuration and if no value is specified then the following are checked:
- Environment Variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
- EC2 Metadata: also known as instance profile credentials
- Shared Ini File: read from the host system
- ECS Credentials: similar to the EC2 Metadata, but on ECS
- Process Credentials: any credentials set on the current process
- Options: read from passed in `KinesisReportingPluginOptions`

## Format of log records
the log record that is sent to your AWS Kinesis Firehose endpoint will have the following format:
### message logs
```JSON
{
    "logName": "if used with a Verifier this will be the 'description' or 'Test IDs' or a GUID",
    "message": "this is the actual message being logged", 
    "level": "warn", 
    "version": "3.0.0", 
    "buildName": "Jenkins or Team City Job Name", 
    "buildNumber": "Jenkins or Team City Job Number", 
    "machineInfo": {
      "ip": "234.9.10.11",
      "name": "CETH-ARG-WIN10",
      "user": "SYSTEM"
    }
}
```
- **logName** - the `logName` passed to this plugin when loaded from the `Reporter`
- **message** - the `string` being logged by some component
- **level** - a `string` value from one of the `aft-core.LoggingLevel` values based on the level of the message being logged
- **version** - the current version of the `KinesisReportingPlugin`
- **buildName** - a `string` retrieved from the `BuildInfoManager.getBuildName` function
- **buildNumber** - a `string` retrieved from the `BuildInfoManager.getBuildNumber` function
- **machineInfo** - an `aft-core.MachineInfoData` object containing the following:
  - **ip** - a `string` of the machine's IP address
  - **name** - a `string` of the machine's name
  - **user** - a `string` of the currently logged in user who executed the tests

### `TestResult` logs
```JSON
{
    "logName": "if used with Verifier this will be the 'description' or 'Test IDs' or a GUID",
    "result": {
      "testId": "1234",
      "resultMessage": "the final result was a SUCCESS!",
      "status": "passed",
      "resultId": "dbbf6fce-14db-4bd2-ba31-e3fa68d719e4",
      "created": 1655289028279,
      "metadata": {}
    }, 
    "buildName": "Jenkins or Team City Job Name", 
    "buildNumber": "Jenkins or Team City Job Number", 
    "machineInfo": {
      "ip": "234.9.10.11",
      "name": "CETH-ARG-WIN10",
      "user": "SYSTEM"
    }
}
```
- **logName** - the `logName` passed to this plugin when loaded from the `Reporter`
- **result** - an `TestResult` object containing the following:
  - **testId** - a `string` containing any unique ID for the test result being recorded
  - **resultMessage** - a `string` message of the final result
  - **status** - a `string` representing the `aft-core.TestStatus` value
  - **resultId** - a `string` containing a unique identifier for the `TestResult`
  - **created** - a `number` containing the date and time the `TestResult` was created as milliseconds since the epoch
  - **metadata** - an `object` that can contain additional data for the `TestResult`
- **version** - the current version of the `KinesisReportingPlugin`
- **buildName** - a `string` retrieved from the `BuildInfoManager.getBuildName` function
- **buildNumber** - a `string` retrieved from the `BuildInfoManager.getBuildNumber` function
- **machineInfo** - an `aft-core.MachineInfoData` object containing the following:
  - **ip** - a `string` of the machine's IP address
  - **name** - a `string` of the machine's name
  - **user** - a `string` of the currently logged in user who executed the tests