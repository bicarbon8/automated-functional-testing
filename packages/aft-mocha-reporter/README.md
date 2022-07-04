# AFT-Mocha-Reporter
a Mocha `Reporter` integration for AFT providing support for AFT plugins, configuration and helpers

## Installation
`> npm i aft-mocha-reporter`

## Mocha Configuration
using this `Reporter` requires either calling the `mocha` command with the following argument `--reporter=aft-mocha-reporter` or from within a `.mocharc.json` file like the following: 
```json
{
    ...
    "reporter": "aft-mocha-reporter",
    ...
}
```

## AFT Configuration
while no configuration is required, the `aft-mocha-reporter` supports all AFT configuration via an `aftconfig.json` file in the root directory.

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Mocha specs to make use of AFT features.

### `AftLog`
the `AftLog` class provides access to an AFT `LogManager` instance for your currently executing spec file. you can use it like the following:
> **!!WARNING!!** using arrow functions in your Spec definition **IS NOT SUPPORTED** if using `AftLog` because it removes the `this` scope
```javascript
describe('YourTestSuite', () => {
    it('allows you to log using AFT LogManager', async function() {
        const aft = new AftLog(this);
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
> **!!WARNING!!** using arrow functions in your Spec definition **IS NOT SUPPORTED** if using `AftTest` because it removes the `this` scope
```javascript
describe('YourTestSuite', () => {
    it('can check if test [C1234] with known defect <BUG-123> should be run', async function() {
        const aft = new AftTest(this);
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            aft.test.skip();
        }
        await aft.logMgr.error('we should never get here if C1234 should not be run or BUG-123 is open');
    });
});
```
which would output the following to your console and any AFT `LoggingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] with known defect <BUG-123> should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] with known defect <BUG-123> should be run] - WARN - test skipped
```

## NOTES
- the `AftLog` and `AftTest` constructors expects to be passed a valid `scope` containing reference to the currently executing `Mocha.Test`. typically this will be the `this` object within your Spec
- this Mocha `Reporter` works in both parallel and sequential execution modes, but you **MUST ALWAYS** use a non-arrow function for your Spec definition if you are using `AftLog` or `AftTest` classes within your Spec
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