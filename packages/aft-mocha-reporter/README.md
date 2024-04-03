# AFT-Mocha-Reporter
a Mocha `Reporter` integration for AFT providing support for AFT plugins, configuration and helpers

## Installation
`> npm i aft-mocha-reporter`

## Mocha Configuration
using this `Reporter` requires either calling the `mocha` command with the following argument `--reporter=aft-mocha-reporter` or from within a `.mocharc.json` file like the following: 
```json
// .mocharc.json
{
    ...
    "reporter": "/path/to/aft-mocha-reporter.js",
    ...
}
```

## AFT Configuration
the `aft-mocha-reporter` can be conditionally enabled or disabled from within your `aftconfig.json` file in the root directory using the following:
```json
// aftconfig.json
{
    "AftMochaReporterConfig": {
        "enabled": true
    }
}
```
- **enabled** a `boolean` indicating if all AFT results reporting should rely on the `AftMochaReporter` (`true`) or the AFT `Verifier` (`false`). _(defaults to `true`)_
> **!!WARNING!!** if using an AFT `Verifier` or the `AftTest.verify` function inside your `it` calls then set `AftMochaReporterConfig.enabled` to `false` in your `aftconfig.json` to avoid double reporting test results

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Mocha specs to make use of AFT features.

### `AftTest`
the `AftTest` class extends from the `AftTestIntegration` class providing the ability to parse the Spec name for any referenced Test. each Test ID must be surrounded with square brackets `[ABC123]`. you can then either directly call the `AftTest.shouldRun()` async function which will determine if your test should be run based on any AFT `TestExecutionPolicyPlugin` instances referenced in your `aftconfig.json` file or you can call `AftTest.verify(assertion)` which will perform the `AftTest.shouldRun()` call and mark the test as skipped if it should not be run. using the `AftTest` class would look like the following:
> **!!WARNING!!** using arrow functions in your Spec definition **IS NOT SUPPORTED** if using `AftTest` because it removes the `this` scope
```javascript
describe('YourTestSuite', () => {
    // use `AftTest.verify` to report results (ensure `AftMochaReporterConfig.enabled = false`)
    it('can check if test [C1234] should be run', async function() {
        const aft = new AftTest(this);
        await aft.verify(async (v: Verifier) => {
            // `verify` calls `v.test.skip()` if should not be run
            await v.reporter.error('we should never get here if C1234 should not be run');
            const result = await doStuff();
            return result;
        }).returns(equaling('expected')); // AFT Verifier handles submitting the result to any AFT Reporter Plugins
    });

    // use `AftMochaReporter` to report results (`AftMochaReporterConfig.enabled = true` (default value))
    it('can check if test [C2345] should be run', async function() {
        const aft = new AftTest(this);
        if (!(await aft.shouldRun())) {
            await aft.pending(); // marks test as skipped
        } else {
            const result = await doStuff();
            expect(result).to.equal('expected'); // AftMochaReporter handles submitting the result to any AFT Reporter Plugins
        }
    });
});
```
which would output the following to your console and any AFT `ReportingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - test skipped
```

## NOTES
- the `AftTest` constructors expects to be passed a valid `scope` containing reference to the currently executing `Mocha.Test`. typically this will be the `this` object within your Spec
- this Mocha `Reporter` works in both parallel and sequential execution modes, but you **MUST ALWAYS** use a non-arrow function for your Spec definition if you are using `AftTest` class within your Spec
- you can use the AFT `Verifier` in combination with the `AftTest` classes like follows:
```javascript
const aft = new AftTest(this);
await aft.verify((v: Verifier) => {
    /* perform testing here */
}).returns(expected);
```