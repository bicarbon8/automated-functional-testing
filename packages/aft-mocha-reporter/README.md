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

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Mocha specs to make use of AFT features.

### `AftMochaTest`
the `AftMochaTest` class extends from the `AftTest` class providing the ability to parse the Spec name for any referenced Test. each Test ID must be surrounded with square brackets `[ABC123]`. you can then either directly call the `AftMochaTest.shouldRun()` async function which will determine if your test should be run based on any AFT `PolicyPlugin` instances referenced in your `aftconfig.json` file or you can call `AftMochaTest.verify(assertion)` which will perform the `AftMochaTest.shouldRun()` call and mark the test as skipped if it should not be run. using the `AftMochaTest` class would look like the following:
> **!!WARNING!!** using arrow functions in your Spec definition **IS NOT SUPPORTED** if using `AftMochaTest` because it removes the `this` scope
```javascript
describe('YourTestSuite', () => {
    // use `aftMochaTest` to report results
    it('can check if test [C1234] should be run', async function() {
        await aftMochaTest(this, async (v: AftMochaTest) => {
            // calls `v.test.skip()` if should not be run
            await v.reporter.error('we should never get here if C1234 should not be run');
            const result = await doStuff();
            await t.verify(result, equaling('expected'));
        }); // handles submitting the result to any AFT Reporter Plugins
    });

    // use `AftMochaReporter` to report results
    it('can check if test [C2345] should be run', async function() {
        const aft = new AftMochaTest(this);
        const shouldRun = await aft.shouldRun();
        if (shouldRun.result !== true) {
            await aft.pending(shouldRun.message); // marks test as skipped
        }
        const result = await doStuff();
        expect(result).to.equal('expected'); // AftMochaReporter handles submitting the result to any AFT Reporter Plugins
    });
});
```
which would output the following to your console and any AFT `ReportingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - test skipped
```

## NOTES
- the `AftMochaTest` constructors expects to be passed a valid `scope` containing reference to the currently executing `Mocha.Test`. typically this will be the `this` object within your Spec
- this Mocha `Reporter` works in both parallel and sequential execution modes, but you **MUST ALWAYS** use a non-arrow function for your Spec definition if you are using `AftMochaTest` class within your Spec