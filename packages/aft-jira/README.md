# AFT-Jira
provides Jira result logging as well as test execution filtering for users of `aft-core` by implementing plugins for the `ReportingPlugin` and `TestExecutionPolicyPlugin` plugin base classes.

## JiraReportingPlugin
the `JiraReportingPlugin` extends from `ReportingPlugin` in `aft-core`. if enabled, this plugin will, upon receiving a failing test result, check for any existing open defects referencing the Test ID and if found, add a comment that the issue still exists or, if not found, will mark the defect as resolved. it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "logLevel": "info",
    "pluginNames": [
        "jira-reporting-plugin"
    ],
    "JiraConfig": {
        "url": "https://your.jira.instance/",
        "user": "valid.user@jira.instance",
        "accesskey": "your_access_key",
        "openDefectOnFail": false,
        "closeDefectOnSuccess": false,
        "projectId": "123"
    }
}
```
**JiraConfig**:
- **url** - `string` the url of your Jira instance
- **user** - `string` a valid username who has access to all Projects and both read and write permissions
- **accesskey** - `string` a valid API access token for the above user
- **openDefectOnFail** - `bool` if set to `true` a new defect will be created if a failed test result is received and not existing defect is found for the Test ID _(defaults to `false`)_
- **closeDefectOnPass** - `bool` if set to `true` and a passing test result is received and an open defect is found for the Test ID then the defect will be closed as resolved, fixed _(defaults to `false`)_
- **projectId** - `string` the Jira project in which new issues will be created if `openDefectOnFail` is true

## JiraTestExecutionPolicyPlugin
the `JiraTestExecutionPolicyPlugin` extends from `TestExecutionPolicyPlugin` interface in `aft-core`. if enabled this plugin will search Jira for open defects referencing the specified Test IDs from the set of IDs passed in to a `Verifier.withTestId` function and if found this plugin will return a result of `false` from the `shouldRun` function. it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "logLevel": "info",
    "pluginNames": [
        "jira-test-execution-policy-plugin"
    ],
    "JiraConfig": {
        "url": "https://your.jira.instance/",
        "user": "valid.user@jira.instance",
        "accesskey": "your_access_key",
        "policyEngineEnabled": true
    }
}
```
## Configuration
to open or modify defects in Jira, you will need to have an account with both read and write permissions. These values can be specified in your `aftconfig.json` as follows:
```json
{
    "JiraConfig": {
        "url": "http://fake.jira.io",
        "user": "your.email@your.domain.com",
        "accesskey": "your_jira_api_key_or_password",
        "policyEngineEnabled": true
    }
}
```
- **url** - [REQUIRED] the full URL to your instance of Jira. _(NOTE: this is **NOT** the API URL, just the base domain name)_
- **user** - [REQUIRED] the email address of the user that will submit test results
- **accesskey** - [REQUIRED] the access key (or password) for the above user
- **policyEngineEnabled** - `bool` if set to `true` then any `verifier` with a Test ID will first check that the test should be run via this plugin. any open defects referencing this Test ID will result in a `false` response _(defaults to `true`)_

## Usage
you can submit results directly by calling the `aft-core.Reporter.submitResult(result: TestResult)` function or results will automatically be submitted if using the `aft-core.verify(assertion)` with valid `testCases` specified in the `options` object. 

### via `aft-core.Reporter`:
```typescript
let reporter = new Reporter({logName: 'example'});
await reporter.submitResult({
    testId: 'C3190', // must exist in TestRail plan or project and suites
    status: TestStatus.Failed,
    resultMessage: 'there was an error when running this test'
});
```
### via `aft-core.verify` (`aft-core.Verifier`):
```typescript
/** 
 * `TestStatus.retest` result for `C3190`, `C2217763`, and `C3131` sent to TestRail
 * following execution because expectation fails
 */
await verify(() => (1 + 1)).returns(3) 
.withTestIds('C3190', 'C2217763', 'C3131')
.and.withDescription('expected to fail because 1+1 != 3');
```
