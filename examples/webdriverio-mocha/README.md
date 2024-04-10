# Examples: WebdriverIO and Mocha
Automated Functional Testing (AFT) repo providing examples and best practices for using the AFT libraries with WebdriverIO and Mocha test framework. This repo can serve as a quick-start project for functional testing projects.

## Usage:
using AFT allows for setting configuration values in the `aftconfig.json` depending on the type of testing you're planning on performing.

### Example `aftconfig.json`

```json
{
    "plugins": [
        {"name": "testrail-reporting-plugin", "searchDir": "../"},
        {"name": "testrail-policy-plugin", "searchDir": "../"},
        {"name": "kinesis-reporting-plugin", "searchDir": "../"},
        {"name": "html-reporting-plugin", "searchDir": "../"},
        {"name": "filesystem-reporting-plugin", "searchDir": "../"},
        {"name": "grid-session-generator-plugin", "searchDir": "../"},
        {"name": "local-session-generator-plugin", "searchDir": "../"},
        {"name": "webdriverio-remote-session-generator-plugin", "searchDir": "../"}
    ],
    "logLevel": "info",
    "KinesisReportingPluginConfig": {
        "logLevel": "warn",
        "region": "eu-west-1",
        "deliveryStream": "%aws_kinesis_delivery_stream%"
    },
    "TestRailConfig": {
        "url": "%testrail_url%",
        "user": "%testrail_user%",
        "accessKey": "%testrail_pass%",
        "projectId": 3,
        "suiteIds": [744],
        "logLevel": "error",
        "policyEngineEnabled": true
    },
    "JiraConfig": {
        "url": "%jira_url%",
        "user": "%jira_user%",
        "accessKey": "%jira_pass%",
        "projectId": "1000",
        "closeDefectOnPass": true,
        "openDefectOnFail": true,
        "policyEngineEnabled": true
    },
    "UiSessionManagerConfig": {
        "generatorName": "grid-session-generator-plugin",
        "options": {
            "url": "https://hub-cloud.browserstack.com/wd/hub",
            "capabilities": {
                "browserName": "chrome",
                "bstack:options": {
                    "userName": "%browserstack_user%",
                    "accessKey": "%browserstack_key%",
                    "os": "windows",
                    "osVersion": "11",
                    "debug": true
                }
            }
        }
    }
}
```
- **plugins** - `Array<string | PluginLocator>` containing names that should match the filename and classname (if you remove characters like `-`, `_` and `.`) of the plugins to load. the array can contain either a `string` in which case the plugin will be loaded by searching starting from the current NodeJs execution directory or it can be a `PluginLocator` containing a `name` and `searchDir` field in which case the plugin will be loaded by searching starting from the `searchDir`. _(if not set, `searchDir` defaults to `process.cwd()`)_
- **logLevel** - `string` containing the minimum `LogLevel` where logs will be sent to the console. this value can also serve as a global fall-back for logging plugin implementations using `aftConfig.logLevel` if no value is specified for the given plugin. _(defaults to `'warn'`)_
- **KinesisReportingPluginConfig** - configuration for the `kinesis-reporting-plugin`
  - **logLevel** - the minimum level where logs will be forwarded to your AWS Kinesis Firehose delivery stream. _(defaults to `'none'`)_
  - **region** - `string` containing an AWS Region System Name like `'eu-west-1'`
  - **deliveryStream** - `string` containing the Kinesis Firehose delivery stream to use
  - **batch** - `boolean` indicating if logs should be batched before being sent to reduce the number of calls being made. _(defaults to `true`)_
  - **batchSize** - `number` indicating the number of log records to wait for before sending. _(defaults to `10`)_
- **TestRailConfig** - configuration values to use for TestRail integration
  - **url** - `string` containing the URL used for accessing your TestRail instance. _NOTE: this is **NOT** the API url, but the URL to access the base instance of TestRail_
  - **user** - `string` containing a valid username for logging in to TestRail
  - **accessKey** - `string` containing your API access key used to access the TestRail API. see [here](https://www.gurock.com/testrail/docs/api/getting-started/accessing) for more info.
  - **projectId** - `number` containing the TestRail project you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **suiteIds** - `Array<number>` containing a list of the TestRail suites you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **planId** - `number` containing the TestRail plan you are referencing in your tests. _NOTE: if not specified and the `testrail-reporting-plugin` is using a `logLevel` of anything other than `'none'` a new TestRail plan will be created based on your `projectId` and `suiteIds`_
  - **logLevel** - `string` containing the minimum `LogLevel` where logs will be captured and sent to TestRail on completion of a test. _NOTE: setting this to a value of `'none'` disabled sending results to TestRail, but you can still use TestRail to control test execution via the `policyEngineEnabled` configuration setting_
  - **policyEngineEnabled** - `boolean` indicating if TestRail should be used to control the execution of tests run within an `AftTest`
- **JiraConfig** - configuration values to use for Jira integration
  - **url** - `string` containing the URL used for accessing your Jira instance. _NOTE: this is **NOT** the API url, but the URL to access the base instance of Jira_
  - **user** - `string` containing a valid username for logging in to Jira
  - **accessKey** - `string` containing your API access key used to access the Jira API.
  - **projectId** - `string` containing a valid project ID where new defects will be created if `openDefectOnFail` is set to `true`. _NOTE: new defects will not be created and this can be left unset if `openDefectOnFail` is `false`_
  - **openDefectOnFail** - `boolean` indicating if a new defect should be created when a test failure occurs _(defaults to `false`)_
  - **closeDefectOnPass** - `boolean` indicating if any open defects referencing the currently passing test ID should be closed on successful completion of the test _(defaults to `false`)_
  - **policyEngineEnabled** - `boolean` indicating if each a search of open Jira issues should be performed for each test ID to determine if the test should be run when using an `AftTest`. _(defaults to `true`)_
- **UiSessionConfig** - configuration for the `UiSessionGeneratorManager` to use to determine which `UiSessionGeneratorPlugin` to use
  - **generatorName** - `string` containing the name of the `UiSessionGeneratorPlugin` to use when generating UI sessions
  - **options** - `object` containing any properties that will be passed to the loaded `UiSessionGeneratorPlugin.getSession` function and that can be used by the plugin to control the type of session to create

## Test Execution
running `npm run test:e2e` will execute the tests using Mocha which should result in output like the following being sent to the console (assuming the `Reporter.level` is set to something like `info` in your `aftconfig.json`):
```
14:51:33 - [can access websites using AFT and Browser Components] - STEP  - 1: navigate to LoginPage...
14:51:35 - [can access websites using AFT and Browser Components] - STEP  - 2: login
14:51:36 - [can access websites using AFT and Browser Components] - INFO  - sending tomsmith to the Username Input
14:51:36 - [can access websites using AFT and Browser Components] - INFO  - username entered
14:51:37 - [can access websites using AFT and Browser Components] - INFO  - sending SuperSecretPassword! to the Password Input
14:51:37 - [can access websites using AFT and Browser Components] - INFO  - password entered
14:51:37 - [can access websites using AFT and Browser Components] - INFO  - clicking Login Button...
14:51:39 - [can access websites using AFT and Browser Components] - INFO  - Login Button clicked
14:51:39 - [can access websites using AFT and Browser Components] - STEP  - 3: wait for message to appear...
14:51:39 - [can access websites using AFT and Browser Components] - STEP  - 4: get message...
14:51:41 - [can access websites using AFT and Browser Components] - PASS  - C3456
14:51:41 - [can access websites using AFT and Browser Components] - PASS  - C2345
14:51:41 - [can access websites using AFT and Browser Components] - PASS  - C1234
```

## TestRail and Jira integration
if using `testrail-reporting-plugin`, `testrail-policy-plugin`, `jira-reporting-plugin` or `jira-policy-plugin` then you must ensure your `verify(assertion)`, or `AftTest` instances have valid Test Case ID's referenced. The values specified for the `withTestIds` function must be the TestRail Case ID's referenced by your existing TestRail Plan (not to be confused with the TestRail Test ID's that start with the letter _T_). Modifications will need to be made in two places per test:

### Specifying Test IDs
on the `AftTest` instance, include the following in your options:
```typescript
await aftTest('performing tests against three test IDs', () => someTestAction(), {
    testIds: ['C1234', 'C2345', 'C3456']
});
```
or, by including the Test IDs in the test description like the following:
```typescript
it('[C1234] can include tests [C2345] in the title [C3456]', async function() {
    /**
     * - for Jest use: `await aftJestTest(expect, () => testStuff());`
     * - for Mocha use: `await aftMochaTest(this, () => testStuff());`
     * - for Jasmine use: `await aftJasmineTest(() => testStuff());`
     */
    await aftMochaTest(this, () => someTestAction());
})
```

> WARNING: Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
aftTest('some test description', () => expect('foo').toBe('bar')); // AFT will report as 'passed'

aftTest('some test description', (t: AftTest) => t.verify('foo','bar')); // AFT will report as 'failed'
```