# AFT-Vitest-Reporter
a Vitest `Reporter` integration for AFT providing support for AFT plugins, configuration and helpers

## Installation
`> npm i aft-vitest-reporter`

## Vitest Configuration
using this `Reporter` requires either calling the `vitest` command with the following argument `--reporter=aft-vitest-reporter` or from within a `vitest.config.mjs` file like the following: 
```javascript
// vitest.config.mjs
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  ...configDefaults,
  test: {
    reporters: ['default', './node_modules/aft-vitest-reporter/dist/src/aft-vitest-reporter.js'],
    environment: 'node',
  }
});
```

## AFT Helpers
this package comes with two helper classes that can be utilised from within your Vitest specs to make use of AFT features.

### `AftVitestTest`
the `AftVitestTest` class extends from the `AftTest` class providing the ability to parse the Spec name for any referenced Test. each Test ID must be surrounded with square brackets `[ABC123]`. you can then either directly call the `AftVitestTest.shouldRun()` async function which will determine if your test should be run based on any AFT `PolicyPlugin` instances referenced in your `aftconfig.json` file or you can call `aftVitestTest(this, testFunction)` which will perform the `AftVitestTest.shouldRun()` call and mark the test as skipped if it should not be run. using the `AftVitestTest` class would look like the following:
> **!!WARNING!!** using arrow functions in your Spec definition **IS NOT SUPPORTED** if using `AftVitestTest` because it removes the `this` scope
```javascript
describe('YourTestSuite', () => {
    // use `aftVitestTest` to report results
    it('can check if test [C1234] should be run', async function() {
        await aftVitestTest(this, async (v: AftVitestTest) => {
            // calls `v.test.skip()` if should not be run
            await v.reporter.error('we should never get here if C1234 should not be run');
            const result = await doStuff();
            await t.verify(result, equaling('expected'));
        }); // handles submitting the result to any AFT Reporter Plugins
    });

    // use `AftVitestReporter` to report results
    it('can check if test [C2345] should be run', async function() {
        const aft = new AftVitestTest(this);
        const shouldRun = await aft.shouldRun();
        if (shouldRun.result !== true) {
            await aft.pending(shouldRun.message); // marks test as skipped
        }
        const result = await doStuff();
        expect(result).to.equal('expected'); // AftVitestReporter handles submitting the result to any AFT Reporter Plugins
    });
});
```
which would output the following to your console and any AFT `ReportingPlugin` instances referenced in your `aftconfig.json` if the test ID should not be run:
```text
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - none of the supplied tests should be run: [C1234]
17:52:45 - [YourTestSuite can check if test [C1234] should be run] - WARN - test skipped
```

## NOTES
- the `AftVitestTest` constructors expects to be passed a valid `scope` containing reference to the currently executing `Vitest.Test`. typically this will be an object passed in to your `test` or `it` function within your Spec
- this Vitest `Reporter` works in both parallel and sequential execution modes, but you **MUST ALWAYS** pass a context to your `it` or `test` function if you are using `AftVitestTest` class within your Spec
- the `aft-vitest-reporter` Vitest Reporter can be used when testing with an environment of `node` or `jsdom` or any of the supported Vitest environment config values, but the `AftVitestTest` class and `aftVitestTest` function can only be used with your environment set to `node` via your `vitest.config.mjs` file