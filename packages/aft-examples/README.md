# AFT-Examples
Automated Functional Testing (AFT) repo providing examples and best practices for using the Framework. This repo can serve as a quick-start project for functional testing projects.

## Usage:
using AFT allows for setting configuration values in the `aftconfig.json` depending on the type of testing you're planning on performing.

### Example `aftconfig.json`

```json
{
    "pluginNames": [
        "testrail-logging-plugin",
        "testrail-test-case-plugin",
        "kinesis-logging-plugin",
        "html-logging-plugin",
        "filesystem-logging-plugin",
        "grid-session-generator-plugin",
        "local-session-generator-plugin",
        "webdriverio-remote-session-generator-plugin"
    ],
    "pluginsSearchDir": "../",
    "LogManagerConfig": {
        "logLevel": "info"
    },
    "KinesisLoggingPluginConfig": {
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
- **pluginNames** - `Array<string>` containing names that should match the filename and classname (if you remove characters like `-`, `_` and `.`) of the plugins to load
- **pluginsSearchDir** - `string` containing a relative path (to `process.cwd()`) used to search for the plugins listed in the `pluginNames` array. _(defaults to `process.cwd()`)_
- **LogManagerConfig** - configuration for any `LogManager` instances
  - **logLevel** - `string` containing the minimum `LogLevel` where logs will be sent to the console. this value can also serve as a global fall-back for logging plugin implementations using `aftConfig.getSection(LogManagerConfig).logLevel` if no value is specified for the given plugin. _(defaults to `'warn'`)_
- **KinesisLoggingPluginConfig** - configuration for the `kinesis-logging-plugin`
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
  - **planId** - `number` containing the TestRail plan you are referencing in your tests. _NOTE: if not specified and the `testrail-logging-plugin` is using a `logLevel` of anything other than `'none'` a new TestRail plan will be created based on your `projectId` and `suiteIds`_
  - **logLevel** - `string` containing the minimum `LogLevel` where logs will be captured and sent to TestRail on completion of a test. _NOTE: setting this to a value of `'none'` disabled sending results to TestRail, but you can still use TestRail to control test execution via the `policyEngineEnabled` configuration setting_
  - **policyEngineEnabled** - `boolean` indicating if TestRail should be used to control the execution of tests run within a `Verifier`
- **UiSessionConfig** - configuration for the `UiSessionGeneratorManager` to use to determine which `UiSessionGeneratorPlugin` to use
  - **generatorName** - `string` containing the name of the `UiSessionGeneratorPlugin` to use when generating UI sessions
  - **options** - `object` containing any properties that will be passed to the loaded `UiSessionGeneratorPlugin.getSession` function and that can be used by the plugin to control the type of session to create

## Test Execution
executing the tests using `npm test` should result in the output like the following sent to the console (assuming the `LogManager.level` is set to something like `info` in your `aftconfig.json`):
```
14:51:33 - [can access websites using AFT and Page Widgets and Facets] - STEP  - 1: navigate to LoginPage...
14:51:35 - [can access websites using AFT and Page Widgets and Facets] - STEP  - 2: login
14:51:36 - [can access websites using AFT and Page Widgets and Facets] - INFO  - sending tomsmith to the Username Input
14:51:36 - [can access websites using AFT and Page Widgets and Facets] - INFO  - username entered
14:51:37 - [can access websites using AFT and Page Widgets and Facets] - INFO  - sending SuperSecretPassword! to the Password Input
14:51:37 - [can access websites using AFT and Page Widgets and Facets] - INFO  - password entered
14:51:37 - [can access websites using AFT and Page Widgets and Facets] - INFO  - clicking Login Button...
14:51:39 - [can access websites using AFT and Page Widgets and Facets] - INFO  - Login Button clicked
14:51:39 - [can access websites using AFT and Page Widgets and Facets] - STEP  - 3: wait for message to appear...
14:51:39 - [can access websites using AFT and Page Widgets and Facets] - STEP  - 4: get message...
14:51:41 - [can access websites using AFT and Page Widgets and Facets] - PASS  - C3456
14:51:41 - [can access websites using AFT and Page Widgets and Facets] - PASS  - C2345
14:51:41 - [can access websites using AFT and Page Widgets and Facets] - PASS  - C1234
```

## TestRail Logging
if using `testrail-logging-plugin` then you must ensure your `verify(assertion)`, `verifyWithSelenium(assertion)`, `verifyWithWebdriverIO(assertion)`, `Verifier`, `SeleniumVerifier`, or `WebdriverIoVerifier` instances have valid TestRail Case ID's referenced. The values specified for the `withTestId` function must be the TestRail Case ID's referenced by your existing TestRail Plan (not to be confused with the TestRail Test ID's that start with the letter _T_). Modifications will need to be made in two places per test:

### Specifying Test IDs
in the options object, set the following:
```typescript
await verify(() => someTestAction())
    .withTestId('C1234')
    .and.withTestId('C2345')
    .and.withTestId('C3456');
```
specifying the TestRail Case ID's for the Cases you wish to cover.

> WARNING: Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
verify(() => expect('foo').toBe('bar')); // AFT will report as 'passed'

verify(() => 'foo').returns('bar'); // AFT will report as 'failed'
```