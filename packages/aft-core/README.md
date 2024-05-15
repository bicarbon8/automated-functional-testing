# AFT-Core
the base Automated Functional Testing (AFT) library providing support for Plugins, configuration, and helper classes and functions

## Installation
`> npm i aft-core`

## Configuration
the `aft-core` package contains the `aftConfig` constant class (instance of `new AftConfig()`) for reading in configuration an `aftconfig.json`, `aftconfig.js`, `aftconfig.cjs` or `aftconfig.mjs` file at the project root. this configuration can be read as a top-level field using `aftConfig.get('field_name')` or `aftConfig.get('field_name', defaultVal)` and can also be set without actually modifying the values in your `aftconfig.json` using `aftConfig.set('field_name', val)`. additionally, configuration classes can be read using `AftConfig` with the `aftConfig.getSection(ConfigClass)` which will read from your `aftconfig.json` file for a field named `ConfigClass`

#### NOTE: 
> - when a new instance of `AftConfig` is created the `dotenv` package is run and any `.env` file found at your project root (`process.cwd()`) will be processed into your environment variables making it easier to load values when developing and testing locally.
> - if using a javascript `aftconfig` file, you must export the config object using `module.exports = { ... }`

Ex: with an `aftconfig.json` containing:
```json
{
    "SomeCustomClassConfig": {
        "configField1": "%your_env_var%",
        "configField2": "some-value",
        "configField3": ["foo", true, 10]
    }
}
```
and with the following environment variables set:
> export your_env_var="an important value"

and a config class of:
```typescript
export class SomeCustomClassConfig {
    configField1: string = 'default_value_here';
    configField2: string = 'another_default_value';
    configField3: Array<string | boolean | number> = ['default_val'];
    configField4: string = 'last_default_value';
}
```

can be accessed using an `AftConfig` instance as follows:
```typescript
const config = aftConfig.getSection(SomeCustomClassConfig); // or new AftConfig().getSection(SomeCustomClassConfig);
config.configField1; // returns "an important value"
config.configField2; // returns "some-value"
config.configField3; // returns ["foo", true, 10] as an array
config.configField4; // returns "last_default_value"
```

and if you wish to entirely disregard the configuration specified in your `aftconfig.json` file you can use the following (still based on the above example):
```typescript
const config = new AftConfig({
    SomeCustomClassConfig: {
        configField1: 'custom_value_here'
    }
});
config.configField1; // returns "custom_value_here"
config.configField2; // returns "another_default_value"
config.configField3; // returns ["default_val"] as an array
config.configField4; // returns "last_default_value"
```

## Helpers
the `aft-core` package contains several helper and utility classes, interfaces and functions to make functional testing and test development easier. These include:
- **rand** - random string, boolean, number and uuid generation
- **convert** - string manipulation like Base64 encode / decode and replacement
- **ellide** - string elliding supporting beginning, middle and end ellipsis
- **Err** - a `module` that can run functions in a `try-catch` with optional logging as well as provide formatted string outputs from `Error` objects
- **using** - automatically call the `dispose` function of a class that implements the `Disposable` interface when done
- **MachineInfo** - get details of the host machine and user running the tests
- **CacheMap** - a `Map` implementation that stores values with expirations where expired items will not be returned and are pruned from the `Map` automatically. The `CacheMap` can also optionally store its data on the filesystem allowing for other running node processes to read from the same cache data (e.g. sharded parallel testing)
- **FileSystemMap** - a `Map` implementation that stores its values in a file on the filesystem allowing multiple node processes to share the map data or to persist the data over multiple iterations
- **fileio** - a constant class providing file system `write` and `readAs<T>` functions to simplify file operations
- **wait** - constant class providing `wait.forResult<T>(...): Promise<T>`, `wait.forDuration(number)`, and `wait.until(number | Date): Promise<void>` functions to allow for non-thread-locking waits
- **retry** - constant class providing `retry<T>(retryable).until(condition): Promise<T>` async function that will retry a given `retryable` function until it passes a condition or a specified number of attempts or elapsed time is exceeded
- **AftTest** - see: [Testing with AftTest](#testing-with-afttest) section below

## Custom Types
`aft-core` also comes with some helpful types that can make building automated tests a bit easier such as:
- **Action&lt;T&gt;** - a function accepting one typed argument `T` and returning `void`
- **Func&lt;T, Tr&gt;** - a function accepting one typed argument `T` and returning a specified type `Tr`
- **Class&lt;T&gt;** - a class of type `T` accepting 0 or more arguments on the constructor
- **ProcessingResult** - a more expressive return value that can be used when you want both a boolean _success_ and data as a result
- **JsonObject** - an object that can be serialised and deserialised into a Javascript Object without loss of data
- **JsonKey** - a value that can be used as a valid JSON object key
- **JsonValue** - value that can be used as a valid JSON object value
- **Merge&lt;T1, T2, T3 = {}, T4 = {}, T5 = {}, T6 = {}&gt;** - a type that can be used to create merged types (types made up of 2 or more types)

## Plugins

### Example Reporting Plugin
to create your own simple reporting plugin that stores all logs until the `finalise` function is called you would implement the code below.

#### NOTE:
> configuration for the below can be added in a object in the `aftconfig.json` named `OnDisposeConsoleReportingPluginConfig` and optionally containing values for the supported properties of the `OnDisposeConsoleReportingPluginConfig` class
```typescript
export class OnDisposeConsoleReportingPluginConfig {
    maxLogLines: number = Infinity;
    logLevel: LogLevel = 'warn';
};
export class OnDisposeConsoleReportingPlugin extends ReportingPlugin {
    public override get logLevel(): LogLevel { return this._lvl; }
    private readonly _lvl: LogLevel;
    private readonly _logs: Map<string, Array<LogMessageData>>;
    private readonly _maxLines: number;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(OnDisposeConsoleReportingPluginConfig);
        this._lvl = cfg.logLevel ?? 'warn';
        if (this.enabled) {
            this._logs = new Map<string, Array<LogMessageData>>();
        }
    }
    override initialise = async (name: string): Promise<void> => {
        if (!this._logs.has(name)) {
            this._logs.set(name, new Array<LogMessageData>());
        }
    }
    override log = async (logData: LogMessageData): Promise<void> => {
        if (this.enabled) {
            if (LogLevel.toValue(level) >= LogLevel.toValue(this.logLevel) && level != 'none') {
                const namedLogs: Array<LogMessageData> = this._logs.get(name);
                namedLogs.push({name, level, message, args: data});
                while (namedLogs.length > this.maxLogLines) {
                    namedLogs.shift();
                }
            }
        }
    }
    override submitResult = async (result: TestResult): Promise<void> => {
        /* ignore */
    }
    override finalise = async (name: string): Promise<void> => { 
        if (this.enabled) {
            const namedLogs = this._logs.get(name);
            while (namedLogs?.length > 0) {
                let data = namedLogs.shift();
                aftLogger.log({name: data.name, level: data.level, message: data.message, args: data.args});
            });
            aftLogger.log({name: this.constructor.name, level: 'debug', message: `finalised '${name}'`});
        }
    }
}
```

### Example PolicyPlugin (TestRail)
```typescript
export class TestRailConfig {
    username: string;
    password: string;
    url: string = 'https://you.testrail.io';
    projectId: number;
    suiteIds: Array<number> = new Array<number>();
    planId: number;
    enabled: boolean = false;
}
export class TestRailPolicyPlugin extends PolicyPlugin {
    public override get enabled(): boolean { return this._enabled; }
    private readonly _client: TestRailClient;
    private readonly _enabled: boolean;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(TestRailConfig);
        this._enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._client = new TestRailClient(this.aftCfg);
        }
    }
    override shouldRun = async (testId: string): Promise<ProcessingResult> => {
        const result = await this._client.getLastTestResult(testId);
        if (result.status === 'Passed') {
            return false; // test alraedy has passing result so don't run
        }
        return true;
    }
}
```

## Integration with javascript test frameworks
the `aft-core` package comes with an `AftTest` class which can be extended from to allow near seamless integration of AFT's reporting and test execution flow control features. AFT already has packages for integration with a few of the major test frameworks such as Jasmine, Mocha and Jest and these can be used as examples for implementing your own as needed if you are using some other test framework _(NOTE: the Mocha integration also works with Cypress)_. 
- `aft-jasmine-reporter`: [aft-jasmine-test](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jasmine-reporter/README.md#aftjasminetest)
- `aft-mocha-reporter`: [aft-mocha-test](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-mocha-reporter/README.md#aftmochatest)
- `aft-jest-reporter`: [aft-jest-test](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-jest-reporter/README.md#aftjesttest)
- `aft-vitest-reporter`: [aft-vitest-test](https://github.com/bicarbon8/automated-functional-testing/blob/main/packages/aft-vitest-reporter/README.md#aftvitesttest)

## Testing with AftTest
the `AftTest` class and `AftTest.verify` functions of `aft-core` enable testing with pre-execution filtering based on integration with external test execution policy managers via plugin packages extending the `PolicyPlugin` class (see examples above).

```typescript
// jasmine spec using `aft-jasmine-reporter` package
describe('Sample Test', () => {
    it("[C1234][C2345] expect that performActionAsync will return 'result of action'", async () => {
        /**
         * - for Jest use: `const aft = new AftJestTest(expect);`
         * - for Mocha use: `const aft = new AftMochaTest(this);`
         * - for Jasmine use: `const aft = new AftJasmineTest();`
         * - for Vitest use: `const aft = new AftVitTestTest(ctx);`
         */
        await aftJasmineTest(async (t: AftJasmineTest) => {
            const feature: FeatureObj = new FeatureObj();
            /**
             * the `t.verify(actual, expected)` function will compare
             * the `actual` with an `expected` using a `VerifyMatcher`
             * and if the comparison fails and `haltOnVerifyFailure`
             * is `true` (default) it will throw an exception containing
             * details of the failure; otherwise it will continue, having
             * set the overall `AftTest.status` to `'failed'`
             */
            await t.verify(
                () => feature.performActionAsync(),
                containing('result of action'),
                '[C1234] performActionAsync failure'
            ); // sends `TestResult` with test ID 'C1234'
        }); // sends `TestResult` with test ID 'C2345'
    });
});
```

in the above example, the `async (t: AftJasmineTest) => ...` function will only be run if a `PolicyPlugin` is loaded and returns `true` from it's `shouldRun(testId: string)` function (or no `PolicyPlugin` is loaded). additionally, any logs associated with the above `verify` call will use a `name` of `"Sample Test [C1234][C2345] expect that performActionAsync will return 'result of action'"` resulting in log lines like the following (assuming a failure in the `verify` call):
```
09:14:01 - [Sample Test [C1234][C2345] expect that performActionAsync will return 'result of action'] - TRACE - no PolicyPlugin in use so run all tests
09:14:02 - [Sample Test [C1234][C2345] expect that performActionAsync will return 'result of action'] - FAIL  - C1234 - [C1234] performActionAsync failure - expected 'result of action' to be contained in 'invalid data'
09:14:03 - [Sample Test [C1234][C2345] expect that performActionAsync will return 'result of action'] - FAIL  - C1234 - expected 'result of action' to be contained in 'invalid data'
```

#### NOTE:
> the `message` passed to the `verify` function can include one or more test IDs similar to the `description` argument passed to the `AftTest` constructor or `aftTest` function. when test IDs are supplied the `TestResult` (or results) submitted will include the supplied test ID. if no test ID is included or no `message` argument is supplied then the `TestResult` will not include a test ID, but will still affect the `AftTest.status` and prevent an additional `TestResult` from being sent at the completion of the `testFunction` execution unless the `AftTest` included test IDs in the `description` as these will then have a `TestResult` sent for each test ID.

### VerifyMatcher
the `t.verify(actual, expected, message?)` function on `AftTest` can accept a `VerifyMatcher` instance for the `expected` value to enhance the comparison capabilities performed by the check. the following `VerifyMatcher` types are supported within AFT Core:
- `equaling`: performs a `'=='` test between the `actual` and `expected`. ex: `await t.verify(0, equaling(false)); // success`
- `exactly`: performs a `'==='` test between the `actual` and `expected`. ex: `await t.verify(0, exactly(false)); // fail`
- `equivalent`: iterates over all keys of `expected` and compares their type and values to those found on `actual`. ex: `await t.verify({foo: 'bar', baz: true}, equivalent({foo: 'bar', baz: false})); // fail`
- `between`: verifies that the `actual` numerical value is either equal to or between the `minimum` and `maximum` expected values. ex: `await t.verify(42, between(42, 45)); // success`
- `containing`: verifies that the `actual` collection contains the `expected` value. ex: `await t.verify([0, 1, 2, 3], containing(2)); // success`
- `matchingProps`: iterates over all keys of `expected` and compares their type to those found on `actual`. this differs from `equivalent` in that the actual values are not part of the comparison. ex: `await t.verify({foo: 'bar'}, matchingProps({foo: 'foo'})); // success`
- `havingProps`: verifies that the `actual` object contains properties with the specified names and optionally of the specified types. ex: `await t.verify({foo: 'bar', baz: true, bog: 42}, havingProps([['foo', 'string'], 'baz'])); // success`
- `havingValue`: verifies that the `actual` is not equal to `null` or `undefined`. ex: `await t.verify(false, havingValue()); // success`
- `greaterThan`: verifies that the `actual` numerical value is greater than the `expected`. ex: `await t.verify(2, greaterThan(0)); // success`
- `lessThan`: verifies that the `actual` numerical value is less than the `expected`. ex: `await t.verify(0, lessThan(1)); // success`
- `not`: a special use `VerifyMatcher` that negates any `VerifyMatcher` passed into it. ex: `await t.verify([0, 1, 2], not(containing(1))); // fails`
#### NOTE:
> if no `VerifyMatcher` is supplied then `equaling` is used by default

### TestResult
when a `AftTest.run()`, `aftTest(description, testFunction?, options?)` or `AftTest.verify(actual, expected, message?)` function completes a `TestResult` is generated and submitted to the `ReportingManager` associated with the `AftTest` instance using the `ReportingManager.submitResult(result)` function (this then sends on to any `ReportingPlugin` instances). each `TestResult` contains the following fields and data:

```json
// typical TestResult format
{
    "testId": "C1234",
    "testName": "Sample Test [C1234] verify the thing",
    "resultMessage": "thing returned invalid value",
    "status": "failed",
    "resultId": "9d9ed3b7-a6b7-4e1b-b03a-81704aa718df",
    "created": 1715263284960,
    "metadata": {
        "durationMs": 2345,
        "buildName": "USERNAME_MACHINENAME",
        "buildNumber": "YYYYMMDD"
    }
}
```
the `testId` will be set if specified, otherwise it will not be included (set to `undefined`) and the `testName` will be the `ReportingManager.name` (matches the `description` if no `reporter` option is passed to the `AftTest` constructor). within the `metadata` object, the `durationMs`, `buildName` and `buildNumber` cannot be modified, but additional fields can be included by specifying either the `additionalMetadata` option passed to the `AftTest` constructor or by setting the `AftTestConfig.additionalMetadata` config in your `aftconfig.json` file which will then be added to each `TestResult` submitted.

ex:
```json
// aftconfig.json
{
    "AftTestConfig": {
        "additionalMetadata": {
            "aMetaDataKey": "someMetadataValue",
            ...
        }
    }
}
```
