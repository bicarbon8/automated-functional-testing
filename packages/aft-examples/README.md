# AFT-Examples
Automated Functional Testing (AFT) repo providing examples and best practices for using the Framework. This repo can serve as a quick-start project for functional testing projects.

## Usage:
using AFT allows for setting configuration values in the `aftconfig.json` depending on the type of testing you're planning on performing.

### Example `aftconfig.json`

```json
{
    "loggingpluginmanager": {
        "level": "info",
        "pluginNames": [
            "console-logging-plugin",
            "testrail-logging-plugin",
            "kinesis-logging-plugin"
        ]
    },
    "testcasepluginmanager": {
        "pluginNames": ["testrail-test-case-plugin"]
    },
    "testrailconfig": {
        "url": "%testrail_url%",
        "user": "%testrail_user%",
        "accesskey": "%testrail_pass%",
        "projectid": 3,
        "suiteids": [744]
    },
    "testrailloggingplugin": {
        "enabled": false,
        "level": "warn"
    },
    "testrailtestcaseplugin": {
        "enabled": false
    },
    "kinesisconfig": {
        "accessKeyId": "%AWS_ACCESS_KEY_ID%",
        "secretAccessKey": "%AWS_SECRET_ACCESS_KEY%",
        "sessionToken": "%AWS_SESSION_TOKEN%",
        "authenticationType": "config"
    },
    "kinesisloggingplugin": {
        "enabled": false,
        "level": "trace"
    },
    "sessiongeneratorpluginmanager": {
        "pluginNames": ["browserstack-session-generator-plugin"]
    },
    "browserstacksessiongeneratorplugin": {
        "user": "%browserstack_user%",
        "key": "%browserstack_key%",
        "platform": {
            "os": "windows",
            "osVersion": "10",
            "browser": "chrome"
        }
    }
}
```
- **loggingpluginmanager** - allows for loading of `AbstractLoggingPlugin` implementations
  - **pluginNames** - `string[]` containing the name of any logging plugins to be loaded
  - **level** - `string` containing a global override for all logging plugins. valid values can be any of the following: `trace`, `debug`, `info`, `step`, `warn`, `error`
- **testcasepluginmanager** - allows for loading of `AbstractTestCasePlugin` implementations
  - **pluginNames** - `string[]` containing the name of any test case plugins to be loaded
- **testrailconfig** - configuration values to use for TestRail integration
  - **url** - `string` containing the URL used for accessing your TestRail instance. _NOTE: this is **NOT** the API url, but the URL to access the base instance of TestRail_
  - **user** - `string` containing a valid username for logging in to TestRail
  - **accesskey** - `string` containing your API access key used to access the TestRail API. see [here](https://www.gurock.com/testrail/docs/api/getting-started/accessing) for more info.
  - **projectid** - `number` containing the TestRail project you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **suiteids** - `number[]` containing a list of the TestRail suites you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **planid** - `number` containing the TestRail plan you are referencing in your tests. _NOTE: if not specified and using the `testrail-logging-plugin` a new TestRail plan will be created based on your `projectid` and `suiteids`_
- **testrailloggingplugin** - configuration specific to the `testrail-logging-plugin`
  - **enabled** - `boolean` indicating if this plugin is active _(defaults to `true`)_
  - **level** - `string` used to control how verbose logging is when submitting results to TestRail's API. _NOTE: only valid if **NOT** setting a value for `level` in the `loggingpluginmanager` section
- **testrailtestcaseplugin** - configuration specific to the `testrail-test-case-plugin`
  - **enabled** - `boolean` indicating if this plugin is active _(defaults to `true`)_
- **kinesisconfig** - configuration values to use for AWS authentication with Kinesis Firehose _(used by the `kinesis-logging-plugin`)_
  - **accessKeyId** - `string` containing your AWS IAM access key ID. _NOTE: only valid if using `authenticationType` of `config`_
  - **secretAccessKey** - `string` containing your AWS IAM secret access key. _NOTE: only valid if using `authenticationType` of `config`_
  - **sessionToken** - `string` containing your AWS IAM Temporary session token. _NOTE: only valid if using `authenticationType` of `config` and the credentials are from a temporary token_
  - **authenticationType** - `string` indicating how the AWS Credentials are to be obtained. can be one of the following _(defaults to `instance`)_:
    - **config** - indicating the authentication information is contained in the `aftconfig.json` file
    - **instance** - indicating the authentication information is part of the running AWS EC2 instance on which the tests are being run
    - **credsFile** - indicating the authentication information is stored in the user's Credentials File
- **kinesisloggingplugin** - configuration values pertaining to the `kinesis-logging-plugin`
  - **enabled** - `boolean` indicating if this plugin is active _(defaults to `true`)_
  - **level** - `string` used to control how verbose logging is when submitting results to the Kinesis Firehose endpoint. _NOTE: only valid if **NOT** setting a value for `level` in the `loggingpluginmanager` section
- **sessiongeneratorpluginmanager** - allows for loading of `AbstractSessionGeneratorPlugins` implementations
  - **pluginNames** - `string[]` containing the name of any session generator plugins to be loaded. _NOTE: only one session generator plugin can be active at a time so only the first enabled plugin will actually be used_
  - **platform** - `TestPlatform` object containing the `os`, `osVersion`, `browser`, `browserVersion` and `deviceName` to be used for any generated sessions. _NOTE: if specified here, this value overrides `platform` specified under an individual session generator plugin's configuration section_
- **browserstacksessiongeneratorplugin** - configuration specific to the `browserstack-session-generator-plugin`
  - **user** - `string` containing a valid BrowserStack user with access to their _Automate_ product
  - **key** - `string` containing a valid BrowserStack access key for the above user
  - **platform** - `TestPlatform` object containing the `os`, `osVersion`, `browser`, `browserVersion` and `deviceName` to be used for any generated sessions. _NOTE: only valid if **NOT** already specified in the `sessiongeneratorpluginmanager` section

## Test Execution
executing the tests using `npm test` should result in the output like the following sent to the console (assuming the `console-logging-plugin` is loaded and enabled):
```
14:51:33 - can access websites using AFT and Page Widgets and Facets - STEP  - 1: navigate to LoginPage...
14:51:35 - can access websites using AFT and Page Widgets and Facets - STEP  - 2: login
14:51:36 - can access websites using AFT and Page Widgets and Facets - INFO  - sending tomsmith to the Username Input
14:51:36 - can access websites using AFT and Page Widgets and Facets - INFO  - username entered
14:51:37 - can access websites using AFT and Page Widgets and Facets - INFO  - sending SuperSecretPassword! to the Password Input
14:51:37 - can access websites using AFT and Page Widgets and Facets - INFO  - password entered
14:51:37 - can access websites using AFT and Page Widgets and Facets - INFO  - clicking Login Button...
14:51:39 - can access websites using AFT and Page Widgets and Facets - INFO  - Login Button clicked
14:51:39 - can access websites using AFT and Page Widgets and Facets - STEP  - 3: wait for message to appear...
14:51:39 - can access websites using AFT and Page Widgets and Facets - STEP  - 4: get message...
14:51:41 - can access websites using AFT and Page Widgets and Facets - PASS  - C3456
14:51:41 - can access websites using AFT and Page Widgets and Facets - PASS  - C2345
14:51:41 - can access websites using AFT and Page Widgets and Facets - PASS  - C1234
```

## TestRail Logging
if using `testrail-logging-plugin` then you must ensure your `should(options)`, `browserShould(options)`, `TestWrapper` or `BrowserTestWrapper` instances have valid TestRail Case ID's referenced. The values specified for the `testCases` option must be the TestRail Case ID's referenced by your existing TestRail Plan (not to be confused with the TestRail Test ID's that start with the letter _T_). Modifications will need to be made in two places per test:

### `TestWrapperOptions` or `BrowserTestWrapperOptions`
in the options object, set the following:
```typescript
await should({expect: () => someTestAction(), testCases: ['C1234', 'C2345', 'C3456']);
```
specifying the TestRail Case ID's for the Cases you wish to cover.

> NOTE: to ensure Jasmine's _expect_ calls are properly understood by AFT, you should wrap them with AFT's. Ex: 
```typescript
should({expect: () => expect(actual).toBe(expected), description: 'logging name used during testing'});

should({
  expect: () => {
    return expect('foo').toEqual('foo');
  }, 
  testCases: ['C1234']
});
```