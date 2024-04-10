# AFT-TestRail
provides TestRail result logging as well as test execution filtering for users of `aft-core` by implementing plugins for the `ReportingPlugin` and `PolicyPlugin` plugin base classes.

## TestRailReportingPlugin
the `TestRailReportingPlugin` extends from `ReportingPlugin` in `aft-core`. if enabled, this plugin will log test results to test cases in a TestRail Plan (if no plan is specified a new one is created the first time one is attempted to be accessed by the plugin). it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "logLevel": "info",
    "plugin": [
        {"name": "testrail-reporting-plugin", "searchDir": "./node_modules/"}
    ],
    "TestRailConfig": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "accesskey": "your_access_key",
        "planid": 12345,
        "logLevel": "warn",
        "maxLogCharacters": 250,
        "policyEngineEnabled": true
    }
}
```
**TestRailConfig**:
- **logLevel** - [OPTIONAL] `string` value of `none`, `error`, `warn`, `step`, `info`, `debug`, or `trace` _(defaults to value set on `aftConfig.logLevel`)_
- **maxLogCharacters** - [OPTIONAL] `number` for the maximum number of additional log characters to send to TestRail when logging a `TestResult` _(defaults to 250)_
- **policyEngineEnabled** - `bool` if set to `true` then any `aftTest` with a Test ID will first check that the test should be run via this plugin. any matching test in a Test Plan with a `Passing` or `Failing` result or if not using a Test Plan, if the Test ID does not exist in the referenced Project and Suites will result in a `false` response. _(defaults to `true`)_

## TestRailPolicyPlugin
the `TestRailPolicyPlugin` extends from `PolicyPlugin` interface in `aft-core`. if enabled this plugin will lookup the status of TestRail tests based on their case ID from the set of IDs specified in the `AftTest.description` or `AftTestOptions.testIds` array. it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "logLevel": "info",
    "plugin": [
        {"name": "testrail-policy-plugin", "searchDir": "./node_modules/"}
    ],
    "TestRailConfig": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "accesskey": "your_access_key",
        "planid": 12345,
        "policyEngineEnabled": true
    }
}
```
## Configuration
to submit results to or filter test execution based on existence and status of tests in TestRail, you will need to have an account with write permissions in TestRail. These values can be specified in your `aftconfig.json` as follows:
```json
{
    "TestRailConfig": {
        "url": "http://fake.testrail.io",
        "user": "your.email@your.domain.com",
        "accesskey": "your_testrail_api_key_or_password",
        "projectid": 3,
        "suiteids": [1219, 744],
        "planid": 12345,
        "cacheDurationMs": 1000000,
        "logLevel": "trace",
        "maxLogCharacters": 250,
        "policyEngineEnabled": true
    }
}
```
- **url** - [REQUIRED] the full URL to your instance of TestRail. _(NOTE: this is **NOT** the API URL, just the base domain name)_
- **user** - [REQUIRED] the email address of the user that will submit test results
- **accesskey** - [REQUIRED] the access key (or password) for the above user
- **projectid** - the TestRail project containing test suites to be used in test execution. _(Required only if `planid` is not set)_
- **suiteids** - an array of TestRail suites containing test cases to be used in test execution. _(Required only if `planid` is not set)_
- **planid** - an existing TestRail Plan to be used for logging test results if `testrail-reporting-plugin` is referenced and enabled and used for controlling execution of tests. _(NOTE: if no value is specified for `planid` and `testrail-reporting-plugin` is enabled, a new TestRail Plan will be created using the suites specified in `suiteids` and the `projectid`)_
- **cacheDurationMs** - the maximum number of milliseconds to cache responses from TestRail's API _(defaults to 300000)_

## Usage
you can submit results directly by calling the `aft-core.Reporter.submitResult(result: TestResult)` function or results will automatically be submitted if using the `aft-core.verify(assertion)` with valid `testCases` specified in the `options` object. 

> NOTE: sending a `TestResult` with a `TestStatus` of `Failed` will be converted to a status of `Retest` before submitting to TestRail

### via `aft-core.Reporter`:
```typescript
let reporter = new Reporter({logName: 'example'});
await reporter.submitResult({
    testId: 'C3190', // must exist in TestRail plan or project and suites
    status: TestStatus.Failed,
    resultMessage: 'there was an error when running this test'
});
```
### via `aft-core.AftTest` (`aft-core.AftTest.run()`):
```typescript
/** 
 * `TestStatus.retest` result for `C3190`, `C2217763`, and `C3131` sent to TestRail
 * following execution because expectation fails
 */
await aftTest('[C3190][C2217763][C3131]', async (t: AftTest) => {
    await t.verify((1 + 1), 3, 'expected to fail because 1+1 != 3');
});
```
