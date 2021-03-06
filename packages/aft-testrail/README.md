# AFT-TestRail
provides TestRail result logging as well as test execution filtering for users of `aft-core` by implementing plugins for the `AbstractLoggingPlugin` and `AbstractTestCasePlugin` plugin base classes.

## TestRailLoggingPlugin
the `TestRailLoggingPlugin` extends from `LoggingPlugin` in `aft-core`. if enabled, this plugin will log test results to test cases in a TestRail Plan (if no plan is specified a new one is created the first time one is attempted to be accessed by the plugin). it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "LogManager": {
        "level": "info",
        "plugins": [
            {
                "name": "testrail-logging-plugin",
                "options": {
                    "enabled": true,
                    "level": "error",
                    "maxLogCharacters": 100
                }
            }
        ]
    },
    "TestRailConfig": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "accesskey": "your_access_key",
        "planid": 12345
    }
}
```
**PluginConfig**:
- **level** - [OPTIONAL] `string` value of `none`, `error`, `warn`, `step`, `info`, `debug`, or `trace` _(defaults to value set on `LogManager`)_
- **maxLogCharacters** - [OPTIONAL] `number` for the maximum number of additional log characters to send to TestRail when logging a `TestResult` _(defaults to 250)_

## TestRailTestCasePlugin
the `TestRailTestCasePlugin` extends from `TestCasePlugin` interface in `aft-core`. if enabled this plugin will lookup the status of TestRail tests based on their case ID from the set of IDs passed in to a `Verifier.withTestId` function. it can be enabled by including the following in your `aftconfig.json` file:
```json
{
    "TestCaseManager": {
        "pluginNames": [
            {
                "name": "testrail-test-case-plugin",
                "options": {
                    "enabled": true
                }
            }
        ]
    },
    "TestRailConfig": {
        "url": "https://your.testrail.instance/",
        "user": "valid.user@testrail.instance",
        "accesskey": "your_access_key",
        "planid": 12345
    }
}
```
## Configuration
to submit results to or filter test execution based on existence and status of tests in TestRail, you will need to have an account with write permissions in TestRail. These values can be specified in your `aftconfig.json` as follows:
```json
{
    "testrailconfig": {
        "url": "http://fake.testrail.io",
        "user": "your.email@your.domain.com",
        "accesskey": "your_testrail_api_key_or_password",
        "projectid": 3,
        "suiteids": [1219, 744],
        "planid": 12345,
        "cacheDurationMs": 1000000
    }
}
```
- **url** - [REQUIRED] the full URL to your instance of TestRail. _(NOTE: this is **NOT** the API URL, just the base domain name)_
- **user** - [REQUIRED] the email address of the user that will submit test results
- **accesskey** - [REQUIRED] the access key (or password) for the above user
- **projectid** - the TestRail project containing test suites to be used in test execution. _(Required only if `planid` is not set)_
- **suiteids** - an array of TestRail suites containing test cases to be used in test execution. _(Required only if `planid` is not set)_
- **planid** - an existing TestRail Plan to be used for logging test results if `testrail-logging-plugin` is referenced and enabled and used for controlling execution of tests. _(NOTE: if no value is specified for `planid` and `testrail-logging-plugin` is enabled, a new TestRail Plan will be created using the suites specified in `suiteids` and the `projectid`)_
- **cacheDurationMs** - the maximum number of milliseconds to cache responses from TestRail's API _(defaults to 300000)_

## Usage
you can submit results directly by calling the `aft-core.LogManager.logResult(result: TestResult)` function or results will automatically be submitted if using the `aft-core.verify(assertion)` with valid `testCases` specified in the `options` object. 

> NOTE: sending a `TestResult` with a `TestStatus` of `Failed` will be converted to a status of `Retest` before submitting to TestRail

### via `aft-core.LogManager`:
```typescript
let logMgr = new LogManager({logName: 'example'});
await logMgr.logResult({
    testId: 'C3190', // must be an existing TestRail Case ID contained in your referenced TestRail Plan ID
    status: TestStatus.Failed,
    resultMessage: 'there was an error when running this test'
});
```
### via `aft-core.verify` (`aft-core.Verifier`):
```typescript
/** 
 * `TestStatus.Retest` result for `C3190`, `C2217763`, and `C3131` sent to TestRail
 * following execution because expectation fails
 */
await verify(() => (1 + 1)).returns(3) 
.withTestId('C3190')
.and.withTestId('C2217763')
.and.withTestId('C3131')
.and.withDescription('expected to fail because 1+1 != 3');
```
