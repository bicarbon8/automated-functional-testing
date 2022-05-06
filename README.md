# Automated Functional Testing (AFT)
library providing a framework for creating Functional Test Automation supporting integration with external systems via a simple plugin mechanism, which can be used for post-deployment verification testing, end-user acceptance testing, end-to-end testing as well as high-level integration testing scenarios. `AFT` enables test execution flow control and reporting as well as streamlined test development in JavaScript and TypeScript by integrating with common test framworks as well as external test and defect tracking systems (like TestRail and AWS Kinesis Firehose).

## Usage:
### Example Jasmine Test:
```typescript
describe('Sample Test', () => {
    it('can perform a demonstration of AFT', async () => {
        let feature: FeatureObj = new FeatureObj();
        /**
         * the `verify(assertion).returns(expectation)` function
         * checks any specified `AbstractTestCasePlugin`
         * and `AbstractDefectPlugin` implementations
         * to ensure the test should be run. It will then
         * report to any `AbstractLoggingPlugin` implementations
         * with an `ITestResult` indicating the success,
         * failure or skipped status
         */
        await verify(async () => await feature.performAction())
        .withTestId('C1234')
        .and.withKnownDefectId('DEFECT-123')
        .and.withDescription('expect that performAction will return \'result of action\'')
        .returns('result of action');
    });
});
```
the above results in the following console output if the expectation does not return false or throw an exception:
```
5:29:55 PM - expect that performAction will return 'result of action' - PASS  - C1234
```
in more complex scenarios you can perform multiple actions inside the _expectation_ like in the following example:
```typescript
describe('Sample Test', () => {
    it('can perform a more complex demonstration of AFT', async () => {
        /**
         * the passed in expectation can accept a `Verifier` which can be used
         * during more complex actions
         */
        await verify(async (v: Verifier) => {
            await v.logMgr.step('creating instance of FeatureObj');
            let feature: FeatureObj = new FeatureObj();
            await v.logMgr.step('about to call performAction');
            let result: string = await feature.performAction();
            await v.logMgr.info(`result of performAction was '${result}'`);
            await v.logMgr.trace('successfully executed expectation');
            return result;
        }).withTestId('C2345').and.withTestId('C3344')
        .and.withDescription('more complex expectation actions')
        .returns(containing('result of action'));
    });
});
```
which would output the following logs:
```
5:29:54 PM - more complex expectation actions - STEP  - 1: creating instance of FeatureObj
5:29:55 PM - more complex expectation actions - STEP  - 2: about to call performAction
5:29:55 PM - more complex expectation actions - INFO  - result of performAction was 'result of action'
5:29:56 PM - more complex expectation actions - TRACE - successfully executed expectation
5:29:56 PM - more complex expectation actions - PASS  - C2345
5:29:56 PM - more complex expectation actions - PASS  - C3344
```
> WARNING: Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
verify(() => expect('foo').toBe('bar')); // AFT will report as 'passed'

verify(() => 'foo').returns('bar'); // AFT will report as 'failed'

verify(() => {throw new Error('failure');}) // AFT will report as 'failed'
```

## Packages (click on name for more info)
- [`aft-core`](./packages/aft-core/README.md) - base library containing helpers and configuration and plugin managers
- [`aft-logging-awskinesis`](./packages/aft-logging-awskinesis/README.md) - logging plugin supporting logging to AWS Kinesis Firehose
- [`aft-logging-html`](./packages/aft-logging-html/README.md) - logging plugin supporting logging to a HTML results file
- [`aft-testrail`](./packages/aft-testrail/README.md) - logging and test case management plugins supporting logging test results and filtering test execution based on TestRail Projects, Suites and Plans
- [`aft-ui`](./packages/aft-ui/README.md) - base library supporting development of UI testing packages
- [`aft-ui-browsers`](./packages/aft-ui-browsers/README.md) - adds support for Selenium-based UI testing using BrowserStack, Sauce Labs or your own Selenium Grid
- [`aft-ui-mobile-apps`](./packages/aft-ui-mobile-apps/README.md) - adds support for Appium-based UI testing using BrowserStack, Sauce Labs or your own Appium Grid
- [`aft-web-services`](./packages/aft-web-services/README.md) - adds support for testing REST-based services

## Plugins
the primary benefit of using AFT comes from the plugins and the `Verifier`. Because logging using AFT's `LoggingPluginManager` will also send to any registered logging plugins, it is easy to create logging plugins that send to any external system such as TestRail or to log results to Elasticsearch. Additionally, before running any _assertion_ passed to a `verify(assertion)` function, AFT will confirm if the _assertion_ should actually be run based on the results of queries to any supplied `AbstractTestCasePlugin` implementations and a subsequent queries to any supplied `AbstractDefectPlugin` implementations. 

### Logging Plugins
`aft-core` comes bundled with a built-in `ConsoleLoggingPlugin` which can be enabled by adding `console-logging-plugin` to the `pluginNames` array under the `loggingpluginmanager` section of your `aftconfig.json`
```json
{
    "loggingpluginmanager": {
        "pluginNames": [
            "console-logging-plugin",
            "your-own-logging-plugin"
        ],
        "level": "info"
    }
}
```
> NOTE: you can optionally add a `searchDir` field under the `loggingpluginmanager` to specify a root directory to use when searching for logging plugin implementations

### Test Case Plugin
the purpose of an `AbstractTestCasePlugin` implementation is to provide execution control over any expectations by way of supplied _Test IDs_. to specify an implementation of the plugin to load you can add the following to your `aftconfig.json` (where plugins `testrail-test-case-plugin.js` is contained within the test execution directory or a subdirectory of it):
```json
{
    "testcasepluginmanager": {
        "pluginNames": ["testrail-test-case-plugin"]
    }
}
```
> NOTE: if no plugin is specified then external Test Case Management integration will be disabled and _assertions_ will be executed without checking their status before execution

> NOTE: you can optionally add a `searchDir` field under the `testcasepluginmanager` to specify a root directory to use when searching for test case plugin implementations

### Defect Plugin
the purpose of an `AbstractDefectPlugin` implementation is to provide execution control over any expectations by way of supplied _Test IDs_ referenced in an external ticket tracking system like Bugzilla or Jira. to specify an implementation of the plugin to load you can add the following to your `aftconfig.json` (where plugins `defect-plugin.js` is contained within the test execution directory or a subdirectory of it):
```json
{
    "defectpluginmanager": {
        "pluginNames": ["defect-plugin"]
    }
}
```
> NOTE: if no plugin is specified then external Defect Management integration will be disabled and _assertions_ will be executed without checking their status before execution, however if a Defect Management plugin is specified, the execution of any _assertions_ passed into a `verify(assertion)` function will be halted if any non-closed defects are found when searching for defects that contain reference to the values passed in via `withTestId(caseId)` or via direct reference to defect using `withKnownDefectId(defectId)`

> NOTE: you can optionally add a `searchDir` field under the `defectpluginmanager` to specify a root directory to use when searching for defect plugin implementations

## Example Test Project
- [`aft-examples`](./packages/aft-examples/README.md) - a demonstration of how to develop UI and REST based functional test automation using AFT is located under `./packages/aft-examples`

## Contributing to AFT
- create a Fork of the repo in GitHub
- clone the code using `git clone https://github.com/<your-project-area>/automated-functional-testing automated-functional-testing` where `<your-project-area>` is replaced with the location of your Fork
- install yarn using `npm i yarn -g` _(if you don't already have it installed)_
- run `yarn install` to install all dependencies
- build each project using `yarn workspace <project-name> build` where `<project-name>` is a value like `aft-core` or `aft-ui`
- test using `yarn test` or `yarn workspace <project-name> test`
- when you are happy with your changes, submit a Pull Request back to the _main_ branch at https://github.com/bicarbon8/automated-functional-testing

> NOTE: all changes require unit tests and these tests are expected to pass when run via `yarn test`

- Run "yarn nx run-many --target=build --all" to run the build script for every project in the monorepo.
- Run it again to replay the cached computation.
- Run "yarn nx graph" to see the structure of the monorepo.
- Learn more at https://nx.dev/migration/adding-to-monorepo