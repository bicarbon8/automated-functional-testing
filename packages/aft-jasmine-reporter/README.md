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

### `AftLog`
the `AftLog` class provides access to an AFT `LogManager` instance for your currently executing spec file. you can use it like the following:
```javascript
describe('YourTestSuite', () => {
    it('allows you to log using AFT LogManager', async () => {
        const aft = new AftLog();
        await aft.logMgr.step('starting test...');
        /* do some test things here */
        await aft.logMgr.step('test is complete');
    });
});
```
and which would output the following to your console and any AFT `LoggingPlugin` instances referenced in your `aftconfig.json` (assuming your test expectations all pass)
```text
17:52:45 - [YourTestSuite allows you to log using AFT LogManager] - STEP - starting test...
17:54:02 - [YourTestSuite allows you to log using AFT LogManager] - STEP - test is complete
17:54:02 - [YourTestSuite allows you to log using AFT LogManager] - PASS - YourTestSuite allows you to log using AFT LogManager
```

### `AftTest`
the `AftTest` class extends from the `AftLog` adding the ability to parse the Spec name for any referenced Test or Defect IDs. each Test ID must be surrounded with square brackets `[ABC123]` and each Defect ID with less than and greater than symbols `<ABC123>`. additionally you can then call the `AftTest.shouldRun()` async function which will determine if your test should be run based on any AFT `TestCasePlugin` and `DefectPlugin` instances referenced in your `aftconfig.json` file. using the `AftTest` class would look like the following:
```javascript
describe('YourTestSuite', () => {
    it('can check if test [C1234] with known defect <BUG-123> should be run', async () => {
        const aft = new AftTest();
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            pending();
        }
        await aft.logMgr.step('we should never get here if C1234 should not be run or BUG-123 is open');
    });
});
```
which would output the following to your console and any AFT `LoggingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] with known defect <BUG-123> should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] with known defect <BUG-123> should be run] - WARN - test skipped
```

## NOTES
- this Jasmine `CustomReporter` expects that there is only one instance of Jasmine running from a single location as it writes to a file when each Spec is started so that from within a given Spec the `AftLog` and `AftTest` classes can automatically get the Spec description. this causes a performance degradation since there is a locked filesystem read and write operation associated with each test
- you can use the AFT `Verifier` in combination with the `AftLog` or `AftTest` classes like follows:
```javascript
const aft = new AftTest();
await verify(() => {
    /* perform testing here */
}).withLogManager(aft.logMgr)
.and.withTestIds(...aft.testcases)
.and.withKnownDefectIds(...aft.defects)
.returns(expected);
```