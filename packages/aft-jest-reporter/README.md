# AFT-Jest-Reporter
a Jest `Reporter` integration for AFT providing support for AFT plugins, configuration and helpers

## Installation
`> npm i aft-jest-reporter`

## Jest Configuration
using this `Reporter` requires either calling the `jest` command with the following argument `--reporters"default" --reporters="aft-jest-reporter"` or from within your Jest config file using the following: 
```javascript
// jest.config.js
module.exports = {
    reporters: [
        'default',
        ["<rootDir>/node_modules/aft-jest-reporter/dist/src/aft-jest-reporter.js", { useReporter: true }]
    ]
};
```

## AFT Configuration
while no configuration is required, the `aft-jest-reporter` supports all AFT configuration via an `aftconfig.json` file in the root directory.

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Jest specs to make use of AFT features.

### `AftLog`
the `AftLog` class provides access to an AFT `Reporter` instance for your currently executing spec file. you can use it like the following:
```javascript
describe('YourTestSuite', () => {
    test('allows you to log using AFT Reporter', async () => {
        const aft = new AftLog(expect); // passing 'expect' allows AftLog to get the current test full name
        await aft.reporter.step('starting test...');
        /* do some test things here */
        await aft.reporter.step('test is complete');
    });
});
```
and which would output the following to your console and any AFT `ReportingPlugin` instances referenced in your `aftconfig.json` (assuming your test expectations all pass)
```text
17:52:45 - [YourTestSuite allows you to log using AFT Reporter] - STEP - starting test...
17:54:02 - [YourTestSuite allows you to log using AFT Reporter] - STEP - test is complete
17:54:02 - [YourTestSuite allows you to log using AFT Reporter] - PASS - YourTestSuite allows you to log using AFT Reporter
```

### `AftTest`
the `AftTest` class extends from the `AftLog` adding the ability to parse the Spec name for any referenced Test. each Test ID must be surrounded with square brackets `[ABC123]`. additionally you can then call the `AftTest.shouldRun()` async function or use `AftTest.verify(assertion)` which will determine if your test should be run based on any AFT `TestExecutionPolicyPlugin` instances referenced in your `aftconfig.json` file. using the `AftTest` class would look like the following:
```javascript
describe('YourTestSuite', () => {
    test('can check if test [C1234] should be run', async () => {
        const aft = new AftTest(expect); // passing 'expect' allows AftLog to get the current test full name
        await aft.verify(async (v: Verifier) => {
            await aft.reporter.step('we should never get here if C1234 should not be run');
            const result = await doStuff();
            return result;
        }).returns(equaling('stuff'));
    });
});
```
which would output the following to your console and any AFT `ReportingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - test skipped
```

## NOTES
- because Jest refuses to allow programmatic skipping of tests (see: [7245](https://github.com/jestjs/jest/issues/7245)) you will either need to perform all test verification inside an AFT `Verifier` or if using `AftTest` you may call `if (await new AftTest(expect).shouldRun()) { return; }` at the top of your test function to ensure AFT can skip tests that should not be run based on any `TestExecutionPolicyPlugin` responses. this means Jest will report the test as `'passing'`, but AFT will correctly report `'skipped'`
- this Jest `Reporter` expects that there is only one instance of Jest running from a single location as it writes to a file to track the actual status of the test on completion
- you can use the AFT `Verifier` in combination with the `AftLog` or `AftTest` classes like follows:
```typescript
const aft = new AftTest(expect);
await aft.verify(() => {
    /* perform testing here */
}).returns(expected);
```