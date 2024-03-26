# AFT-Jasmine-Reporter
a Jasmine `CustomReporter` integration for AFT providing support for AFT plugins, configuration and helpers

## Installation
`> npm i aft-jasmine-reporter`

## Jasmine Configuration
using this `CustomReporter` requires either calling the `jasmine` command with the following argument `--reporter=aft-jasmine-reporter` or from within your test code using the following: 
```javascript
const AftJasmineReporter = require("aft-jasmine-reporter");
...
jasmine.getEnv().addReporter(AftJasmineReporter);
```

## AFT Configuration
while no configuration is required, the `aft-jasmine-reporter` supports all AFT configuration via an `aftconfig.json` file in the root directory.

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Jasmine specs to make use of AFT features.

### `AftTest`
the `AftTest` class extends from the `AftTestIntegration` class in `aft-core` providing the ability to parse the Spec name for any referenced Test. each Test ID must be surrounded with square brackets `[ABC123]`. additionally you can then call the `AftTest.shouldRun()` async function or use `AftTest.verify(assertion)` which will determine if your test should be run based on any AFT `TestExecutionPolicyPlugin` instances referenced in your `aftconfig.json` file. using the `AftTest` class would look like the following:
> NOTE: the `new AftTest()` command **MUST NOT** be passed a scope when running with the `aft-jasmine-reporter` so it can pull in the scope from filesystem cache set by the reporter. you may still pass an `AftConfig` instance by using the following: `new AftTest(null, new AftConfig())`
```javascript
describe('YourTestSuite', () => {
    it('can check if test [C1234] should be run', async () => {
        const aft = new AftTest(); // no scope should be passed
        await aft.verify(async (v: Verifier) => {
            // `verify` calls `pending()` if should not be run which marks test as skipped
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
- this Jasmine `CustomReporter` expects that there is only one instance of Jasmine running from a single location as it writes to a file when each Spec is started so that from within a given Spec the `AftTest` class can automatically get the Spec description. this causes a performance degradation since there is a locked filesystem read and write operation associated with each test
- you can use the AFT `Verifier` in combination with the `AftTest` classes like follows:
```javascript
const aft = new AftTest();
await aft.verify(() => {
    /* perform testing here */
}).returns(expected);
```