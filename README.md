# Automated Functional Testing (AFT)
library providing a framework for creating Functional Test Automation supporting integration with external systems via a simple plugin mechanism, which can be used for post-deployment verification testing, end-user acceptance testing, end-to-end testing as well as high-level integration testing scenarios. `AFT` enables test execution flow control and reporting as well as streamlined test development in JavaScript and TypeScript by integrating with common test framworks as well as external test and defect tracking systems (like TestRail and AWS Kinesis Firehose).

## Usage:
### Example Jasmine Test:
```typescript
describe('Sample Test', () => {
    it('[C1234] can perform a demonstration of AFT', async function() {
        /**
         * - for Jest use: `const aft = new AftTest(expect);`
         * - for Mocha use: `const aft = new AftTest(this);`
         * - for Jasmine use: `const aft = new AftTest();`
         */
        const aft = new AftTest();
        const feature: FeatureObj = new FeatureObj();
        /**
         * the `verify(assertion).returns(expectation)` function
         * checks any specified `TestExecutionPolicyPlugin` implementations
         * to ensure the test should be run. It will then
         * report to any `ReportingPlugin` implementations
         * with an `TestResult` indicating the success,
         * failure or skipped status
         */
        await aft.verify(async () => await feature.performAction())
            .returns('result of action');
    });
});
```
the above results in the following console output if the expectation does not return false or throw an exception:
```
5:29:55 PM - [[C1234] can perform a demonstration of AFT] - PASS  - C1234
```
in more complex scenarios you can perform multiple actions inside the _expectation_ like in the following example:
```typescript
describe('Sample Test', () => {
    it('[C2345][C3344] can perform a more complex demonstration of AFT', async function() {
        /**
         * - for Jest use: `const aft = new AftTest(expect);`
         * - for Mocha use: `const aft = new AftTest(this);`
         * - for Jasmine use: `const aft = new AftTest();`
         */
        const aft = new AftTest();
        /**
         * the passed in expectation can accept a `Verifier` which can be used
         * during more complex actions
         */
        await aft.verify(async (v: Verifier) => {
            await v.reporter.step('creating instance of FeatureObj');
            let feature: FeatureObj = new FeatureObj();
            await v.reporter.step('about to call performAction');
            let result: string = await feature.performAction();
            await v.reporter.info(`result of performAction was '${result}'`);
            await v.reporter.trace('successfully executed expectation');
            return result;
        }).returns(containing('result of action'));
    });
});
```
which would output the following logs:
```
5:29:54 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - STEP  - 1: creating instance of FeatureObj
5:29:55 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - STEP  - 2: about to call performAction
5:29:55 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - INFO  - result of performAction was 'result of action'
5:29:56 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - TRACE - successfully executed expectation
5:29:56 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - PASS  - C2345
5:29:56 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - PASS  - C3344
```
> WARNING: Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
verify(() => expect('foo').toBe('bar')); // AFT will report as 'passed'

verify(() => 'foo').returns('bar'); // AFT will report as 'failed'

verify(() => {throw new Error('failure');}) // AFT will report as 'failed'
```

## Packages (click on name for more info)
- [`aft-core`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-core/README.md) - base library containing helpers and configuration and plugin managers
- [`aft-examples`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-examples/README.md) - provides real-world examples of how the AFT libraries can be used in functional tests
- [`aft-jasmine-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jasmine-reporter/README.md) - a Jasmine Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-jest-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jest-reporter/README.md) - a Jest Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-mocha-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-mocha-reporter/README.md) - provides Mocha Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-reporting-aws-kinesis-firehose`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-aws-kinesis-firehose/README.md) - reporting plugin supporting logging to AWS Kinesis Firehose
- [`aft-reporting-filesystem`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-filesystem/README.md) - reporting plugin supporting logging to .log files for all log output
- [`aft-reporting-html`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-html/README.md) - reporting plugin supporting logging to a HTML results file
- [`aft-testrail`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-testrail/README.md) - reporting and test execution policy plugins supporting logging test results and filtering test execution based on TestRail Projects, Suites and Plans
- [`aft-ui`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui/README.md) - base library supporting development of UI testing packages
- [`aft-ui-selenium`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui-selenium/README.md) - adds support for Selenium-based UI testing
- [`aft-ui-webdriverio`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui-webdriverio/README.md) - adds support for WebdriverIO-based UI testing
- [`aft-web-services`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-web-services/README.md) - adds support for testing REST-based services

## Plugins
the primary benefit of using AFT comes from the plugins and the `Verifier`. Because logging using AFT's `Reporter` will also send to any registered logging plugins, it is easy to create logging plugins that send to any external system such as TestRail or to log results to Elasticsearch. Additionally, before running any _assertion_ passed to a `verify(assertion)` function, AFT will confirm if the _assertion_ should actually be run based on the results of queries to any supplied `TestExecutionPolicyPlugin` implementations.

### ReportingPlugin
`aft-core` provides a `ReportingPlugin` class which can be extended from to create custom loggers which are then loaded by adding their filenames to the `pluginNames` array under in your `aftconfig.json`
```json
// aftconfig.json
{
    "pluginsSearchDir": "../node_modules",
    "pluginNames": [
        "testrail-reporting-plugin",
        "html-reporting-plugin"
    ],
    "TestRailConfig": {
        "url": "https://your.testrail.io",
        "user": "you@your.domain",
        "accessKey": "yourTestRailApiKey",
        "projectId": 123,
        "suiteIds": [1234, 5678],
        "planId": 123456,
        "policyEngineEnabled": true,
        "logLevel": "error"
    },
    "HtmlReportingPluginConfig": {
        "outputDir": "../Results",
        "logLevel": "debug"
    }
}
```

### TestExecutionPolicyPlugin
the purpose of a `TestExecutionPolicyPlugin` implementation is to provide execution control over any expectations by way of supplied _Test IDs_. to specify an implementation of the plugin to load you can add the following to your `aftconfig.json` (where plugin `testrail-test-execution-policy-plugin.js` is contained within the test execution directory or a subdirectory of it):
```json
// aftconfig.json
{
    "pluginNames": ["testrail-test-execution-policy-plugin"]
}
```
> NOTE: if no plugin is specified then external Policy Engine integration will be disabled and _assertions_ will be executed without first checking that they should be run based on associated Test IDs

## Example Test Project
- [`aft-examples`](./packages/aft-examples/README.md) - a demonstration of how to develop UI and REST based functional test automation using AFT is located under `./packages/aft-examples`

## Contributing to AFT
- create a Fork of the repo in GitHub
- clone the code using `git clone https://github.com/<your-project-area>/automated-functional-testing automated-functional-testing` where `<your-project-area>` is replaced with the location of your Fork
- run `npm install` to install all dependencies
- run a build to ensure `npm workspaces` understands and caches the project layout using `npm run build`
  - NOTE: you can build each project individually using `npm run build --workspace=<project-name>` where `<project-name>` is a value like `aft-core` or `aft-ui`
- run the tests using `npm run test` or individually using `npm run test --workspace=<project-name>`
- when you are happy with your changes, submit a Pull Request back to the _main_ branch at https://github.com/bicarbon8/automated-functional-testing


## NOTES
> all changes require unit tests and these tests are expected to pass when run via `npm run test`

> check for any circular dependencies using `npx dpdm -T --warning false **/index.ts`

> use `npx lerna version` to automatically update the version of all projects at once (all changes must be committed first)

> generate documentation `npm run docs`