# Automated Functional Testing (AFT)
library providing a framework for creating Functional Test Automation supporting integration with external systems via a simple plugin mechanism, which can be used for post-deployment verification testing, end-user acceptance testing, end-to-end testing as well as high-level integration testing scenarios. `AFT` enables test execution flow control and reporting as well as streamlined test development in JavaScript and TypeScript by integrating with common test framworks as well as external test and defect tracking systems (like TestRail and AWS Kinesis Firehose).

## Usage:
### Example Jasmine Test:
```typescript
describe('Sample Test', () => {
    it('[C1234] can perform a demonstration of AFT', async function() {
        const feature: FeatureObj = new FeatureObj();
        /**
         * - for Jest use: `await aftJestTest(expect, () => doStuff());`
         * - for Mocha use: `await aftMochaTest(this, () => doStuff());`
         * - for Jasmine use: `await aftJasmineTest(() => doStuff());`
         * - for ViTest use: `await aftVitestTest(ctx, () => doStuff());`
         */
        const aftJasmineTest(async (t: AftJasmineTest) => {
            const result: string = await feature.performActionAsync();
            /**
             * the `verify(actual, expected)` async function
             * compares the values using a `VerifyMatcher`
             * which defaults to `equaling` if none specified
             */
            await t.verify(result, 'result of action');
        });
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
         * - for Jest use: `await aftJestTest(expect, () => doStuff());`
         * - for Mocha use: `await aftMochaTest(this, () => doStuff());`
         * - for Jasmine use: `await aftJasmineTest(() => doStuff());`
         * - for ViTest use: `await aftVitestTest(ctx, () => doStuff());`
         */
        await aftJasmineTest(async (v: AftJasmineTest) => {
            await v.reporter.step('creating instance of FeatureObj');
            const feature: FeatureObj = new FeatureObj();
            const result = await v.verify(feature.isGood, true, '[C2345] isGood returned not true'); // reports failure result immediately
            await v.reporter.step('about to call performAction');
            const result: string = await feature.performAction();
            await v.reporter.info(`result of performAction was '${result}'`);
            await v.reporter.trace('successfully executed expectation');
            await v.verify(result, containing('result of action'), '[C3344] performAction result mismatch'); // reports failure result immediately
        }, {
            aftCfg: new AftConfig({logLevel: 'trace'}), // overrides `logLevel` used by other tests
            haltOnVerifyFailure: false, // continue if `verify` check fails
            onEventsMap: new Map<AftTestEvent, Array<AftTestFunction>>([
                ['done', [() => performCleanup()]] // function run on completion
            ])
        });
    });
});
```
which would output the following logs:
```
5:29:54 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - STEP  - 1: creating instance of FeatureObj
5:29:55 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - PASS  - C2345
5:29:55 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - STEP  - 2: about to call performAction
5:29:55 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - INFO  - result of performAction was 'result of action'
5:29:56 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - TRACE - successfully executed expectation
5:29:56 PM - [[C2345][C3344] can perform a more complex demonstration of AFT] - PASS  - C3344
```

#### WARNING:
> Jasmine's _expect_ calls do not return a boolean as their type definitions would make you think and failed `expect` calls will only throw exceptions if the stop on failure option is enabled: 
```typescript
await aftTest(description, (t: AftTest) => {
    expect('foo').toBe('bar'); // fails but doesn't throw
}); // AFT will report as 'passed'

await aftTest(description, (t: AftTest) => {
    await t.verify('foo', 'bar'); // fails and throws
}); // AFT will report as 'failed'

await aftTest(description, (t: AftTest) => {
    await t.verify('foo', 'bar'); // fails but doesn't throw
}, { haltOnVerifyFailure = false }); // AFT will report as 'failed'
```

## Packages (click on name for more info)
- [`aft-core`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-core/README.md) - base library containing helpers and configuration and plugin managers
- [`aft-jasmine-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jasmine-reporter/README.md) - a Jasmine Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-jest-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jest-reporter/README.md) - a Jest Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-jira`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jira/README.md) - reporting and test execution policy plugins supporting opening and closing Jira tickets and filtering test execution based on status of Jira tickets (opened vs. closed)
- [`aft-mocha-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-mocha-reporter/README.md) - provides Mocha Reporter Plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-reporting-aws-kinesis-firehose`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-aws-kinesis-firehose/README.md) - reporting plugin supporting logging to AWS Kinesis Firehose
- [`aft-reporting-filesystem`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-filesystem/README.md) - reporting plugin supporting logging to .log files for all log output
- [`aft-reporting-html`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-reporting-html/README.md) - reporting plugin supporting logging to a HTML results file
- [`aft-testrail`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-testrail/README.md) - reporting and test execution policy plugins supporting logging test results and filtering test execution based on TestRail Projects, Suites and Plans
- [`aft-ui`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui/README.md) - base library supporting development of UI testing packages
- [`aft-ui-selenium`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui-selenium/README.md) - adds support for Selenium-based UI testing
- [`aft-ui-webdriverio`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-ui-webdriverio/README.md) - adds support for WebdriverIO-based UI testing
- [`aft-vittest-reporter`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-vitest-reporter/README.md) - provides Vitest Reporter plugin that integrates with AFT to simplify logging and test execution via AFT
- [`aft-web-services`](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-web-services/README.md) - adds support for testing REST-based services

## Plugins
the primary benefit of using AFT comes from the plugins and the `AftTest`. Because logging using AFT's `ReportingManager` will also send to any registered logging plugins, it is easy to create logging plugins that send to any external system such as TestRail or to log results to Elasticsearch. Additionally, before running any _assertion_ passed to a `aftTest(description, testFunction)` function, AFT will confirm if the _testFunction_ should actually be run based on the results of queries to any supplied `PolicyPlugin` implementations.

### ReportingPlugin
`aft-core` provides a `ReportingPlugin` class which can be extended from to create custom loggers which are then loaded by adding their filenames to the `plugins` array under in your `aftconfig.json`
```json
// aftconfig.json
{
    "plugins": [
        "testrail-reporting-plugin",
        {"name": "html-reporting-plugin", "searchDir": "../node_modules"}
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

### PolicyPlugin
the purpose of a `PolicyPlugin` implementation is to provide execution control over any expectations by way of supplied _Test IDs_. to specify an implementation of the plugin to load you can add the following to your `aftconfig.json` (where plugin `testrail-policy-plugin.js` is contained within the test execution directory or a subdirectory of it):
```json
// aftconfig.json
{
    "plugins": ["testrail-policy-plugin"]
}
```
#### NOTE:
> if no plugin is specified then external Policy Engine integration will be disabled and _assertions_ will be executed without first checking that they should be run based on associated Test IDs

## Example Test Projects
- [`cypress-mocha`](./examples/cypress-mocha/README.md) - demonstrates how to use the `AftMochaReporter`, with Cypress e2e tests (NOTE: Cypress tests run in a browser context so the `AftMochaTest` cannot be used as it relies on having a nodejs context)
- [`selenium-jest`](./examples/selenium-jest/README.md) - demonstrates how to use the AFT `SeleniumSession`, `SeleniumComponent`, `AftJestTest` and `AftJestReporter` within Jest tests to verify Browser applications
- [`selenium-mocha`](./examples/selenium-mocha/README.md) - demonstrates how to use the `SeleniumSession`, `SeleniumComponent`, `AftMochaTest` and `AftMochaReporter` within Mocha tests to verify Browser applications
- [`web-services-jasmine`](./examples/web-services-jasmine/README.md) - demonstrates how to use the AFT `HttpService`, `AftJasmineTest` and `AftJasmineReporter` within Jasmine tests to test API endpoints
- [`webdriverio-mocha`](./examples/webdriverio-mocha/README.md) - demonstrates how to use the `WebdriverIoSession`, `WebdriverIoComponent`, `AftMochaTest` and `AftMochaReporter` within Mocha tests to verify Browser and Mobile applications

## Contributing to AFT
- create a Fork of the repo in GitHub
- clone the code using `git clone https://github.com/<your-project-area>/automated-functional-testing automated-functional-testing` where `<your-project-area>` is replaced with the location of your Fork
- run `npm install` to install all dependencies
- run a build to ensure `npm workspaces` understands and caches the project layout using `npm run build`
  - **NOTE:** you can build each project individually using `npm run build --workspace=<project-name>` where `<project-name>` is a value like `aft-core` or `aft-ui`
- run the tests using `npm run test` or individually using `npm run test --workspace=<project-name>`
- when you are happy with your changes, submit a Pull Request back to the _main_ branch at https://github.com/bicarbon8/automated-functional-testing


## NOTES
> all changes require unit tests and these tests are expected to pass when run via `npm run test`

> check for any circular dependencies using `npm run circular`

> use `npx lerna version` to automatically update the version of all projects at once (all changes must be committed first)

> generate documentation `npm run docs`