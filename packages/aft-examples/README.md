# AFT-Examples
Automated Functional Testing (AFT) repo providing examples and best practices for using the Framework. This repo can serve as a quick-start project for functional testing projects.

## Usage:
using AFT allows for setting configuration values in the `aftconfig.json` depending on the type of testing you're planning on performing.

### Example `aftconfig.json`

```json
{
    "LogManager": {
        "level": "info",
        "plugins": [{
            "name": "testrail-logging-plugin",
            "searchDirectory": "../",
            "options": {
                "level": "warn",
                "enabled": false
            }
        },{
            "name": "kinesis-logging-plugin",
            "searchDirectory": "../",
            "options": {
                "level": "trace",
                "batch": true,
                "batchSize": 10,
                "enabled": false
            }
        },{
            "name": "html-logging-plugin",
            "searchDirectory": "../",
            "options": {
                "level": "warn"
            }
        }, {
            "name": "filesystem-logging-plugin",
            "searchDirectory": "../",
            "options": {
                "level": "trace"
            }
        }]
    },
    "TestCaseManager": {
        "plugins": [{
            "name": "testrail-test-case-plugin",
            "searchDirectory": "../",
            "options": {
                "enabled": false
            }
        }]
    },
    "TestRailConfig": {
        "url": "%testrail_url%",
        "user": "%testrail_user%",
        "access_key": "%testrail_pass%",
        "project_id": 3,
        "suite_ids": [744]
    },
    "BrowserSessionGeneratorManager": {
        "uiplatform": "windows_10_chrome",
        "plugins": [{
            "name": "browserstack-browser-session-generator-plugin",
            "searchDirectory": "../",
            "options": {
                "user": "%browserstack_user%",
                "key": "%browserstack_key%",
                "debug": true
            }
        }, {
            "name": "sauce-labs-browser-session-generator-plugin",
            "searchDirectory": "../",
            "options": {
                "username": "%saucelabs_username%",
                "accessKey": "%saucelabs_accessKey%"
            }
        }]
    },
    "MobileAppSessionGeneratorManager": {
        "uiplatform": "android_11_+_+_Google Pixel 5",
        "plugins": [{
            "name": "browserstack-mobile-app-session-generator-plugin",
            "searchDirectory": "../",
            "options": {
                "user": "%browserstack_user%",
                "key": "%browserstack_key%",
                "debug": true,
                "remoteOptions": {
                    "logLevel": "silent"
                }
            }
        }, {
            "name": "sauce-labs-mobile-app-session-generator-plugin",
            "searchDirectory": "../",
            "options": {
                "username": "%saucelabs_username%",
                "accessKey": "%saucelabs_accessKey%"
            }
        }]
    }
}
```
- **LogManager** - allows for loading of `LoggingPlugin` implementations
  - **plugins** - an `array` of `PluginConfig` objects (objects containing `name: string`, `searchDirectory: string`, and `options: object` properties) containing the options used to locate and instantiate logging plugins
  - **level** - `string` containing the default `LogLevel` to set for logging plugins if they don't specify a value in their `PluginConfig.options`. valid values can be any of the following: `trace`, `debug`, `info`, `step`, `warn`, `error`
- **TestCaseManager** - allows for loading of `TestCasePlugin` implementations
  - **plugins** - an `array` of `PluginConfig` objects (objects containing `name: string`, `searchDirectory: string`, and `options: object` properties) containing the options used to locate and instantiate test case plugins (NOTE: only the first enabled plugin will be used)
- **TestRailConfig** - configuration values to use for TestRail integration
  - **url** - `string` containing the URL used for accessing your TestRail instance. _NOTE: this is **NOT** the API url, but the URL to access the base instance of TestRail_
  - **user** - `string` containing a valid username for logging in to TestRail
  - **accesskey** - `string` containing your API access key used to access the TestRail API. see [here](https://www.gurock.com/testrail/docs/api/getting-started/accessing) for more info.
  - **projectid** - `number` containing the TestRail project you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **suiteids** - `number[]` containing a list of the TestRail suites you are referencing in your tests. _NOTE: this is not used if specifying a value for `planid`_
  - **planid** - `number` containing the TestRail plan you are referencing in your tests. _NOTE: if not specified and using the `testrail-logging-plugin` a new TestRail plan will be created based on your `projectid` and `suiteids`_
- **BrowserSessionGeneratorManager** - allows for loading of `BrowserSessionGeneratorPlugin` implementations
  - **plugins** - an `array` of `PluginConfig` objects (objects containing `name: string`, `searchDirectory: string`, and `options: object` properties) containing the options used to locate and instantiate browser session generator plugins (NOTE: only the first enabled plugin will be used)
- **MobileAppSessionGeneratorManager** - allows for loading of `MobileAppSessionGeneratorPlugin` implementations
  - **plugins** - an `array` of `PluginConfig` objects (objects containing `name: string`, `searchDirectory: string`, and `options: object` properties) containing the options used to locate and instantiate browser session generator plugins (NOTE: only the first enabled plugin will be used)

## Test Execution
executing the tests using `npm test` should result in the output like the following sent to the console (assuming the `LogManager.level` is set to something like `info` in your `aftconfig.json`):
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
if using `testrail-logging-plugin` then you must ensure your `verify(assertion)`, `verifyWithBrowser(assertion)`, `verifyWithMobileApp(assertion)`, `Verifier`, `BrowserVerifier`, or `MobileAppVerifier` instances have valid TestRail Case ID's referenced. The values specified for the `withTestId` function must be the TestRail Case ID's referenced by your existing TestRail Plan (not to be confused with the TestRail Test ID's that start with the letter _T_). Modifications will need to be made in two places per test:

### Specifying Test IDs
in the options object, set the following:
```typescript
await verify(() => someTestAction()).withTestId('C1234').and.withTestId('C2345').and.withTestId('C3456');
```
specifying the TestRail Case ID's for the Cases you wish to cover.

> WARNING: Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
verify(() => expect('foo').toBe('bar')); // AFT will report as 'passed'

verify(() => 'foo').returns('bar'); // AFT will report as 'failed'
```