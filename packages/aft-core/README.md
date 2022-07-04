# AFT-Core
the base Automated Functional Testing (AFT) library providing support for Plugins, configuration, and helper classes and functions

## Installation
`> npm i aft-core`

## Configuration
the `aft-core` package contains the `cfgmgr` constant class for reading in configuration from multiple different sources all chained in the following order by default, but updatable using `cfgmgr.set((configKey: string, options: object) => new ChainedProvider([new ProviderOne(), new ProviderTwo(), ...]))`:
- **OptionsProvider** - reads from the passed in `options` object passed to `cfgmgr.get(configKey, options)`
- **EnvVarProvider** - reads from the `process.env` prepending all environment variable keys with the supplied `configKey`
- **AftConfigProvider** - reads from the `aftconfig.json` file starting from a property named with the supplied `configKey`

Ex: with an `aftconfig.json` containing:
```json
{
    "ConfigSectionName": {
        "config_field3": "%your_env_var%",
        "config_field4": "some-value",
        "config_field5": "['foo', true, 10]"
    }
}
```
and with the following environment variables set:
> export your_env_var="an important value"

can be accessed using the `cfgmgr` as follows:
```typescript
const config = cfgmgr.get('ConfigSectionName', {
    config_field1: 12345,
    config_field2: true,
    config_field4: 'a value here'
});
await config.get('config_field1', -1); // returns 12345
await config.get('config_field2', true); // returns false
await config.get<string>('config_field3'); // returns "an important value"
await config.get('config_field4', 'no value'); // returns "a value here" (passed in options override aftconfig.json values)
await config.get<string>('config_field5'); // returns ["foo", true, 10] as an array
```
for classes that rely on dependency injected options, there is also the `optmgr` constant class that will extract environment variables and JSON objects from a object passed to the `optmgr.process()` function. this is useful when combined with the `IHasOptions<T>` interface resulting in easier scoping of lookups on the passed in `options` object.

> NOTE: the `optmgr.process` function is used in the `OptionsProvider` and `AftConfigProvider` classes before returning the values for a given key

## Helpers
the `aft-core` package contains several helper and utility classes, interfaces and functions to make functional testing and test development easier. These include:
- **rand** - random string, boolean, number and uuid generation
- **convert** - string manipulation like Base64 encode / decode and replacement
- **ellide** - string elliding supporting beginning, middle and end ellipsis
- **Err** - a `module` that can run functions in a `try-catch` with optional logging as well as provide formatted string outputs from `Error` objects
- **wait** - continually retry some action until success or a maximum time elapses
- **using** - automatically call the `dispose` function of a class that implements the `IDisposable` interface when done
- **verify** - a function accepting an `assertion` function that simplifies usage of a `Verifier` within your _Jasmine_ or _Mocha_ tests
- **MachineInfo** - get details of the host machine and user running the tests
- **CacheMap** - a `Map` implementation that stores values with expirations where expired items will not be returned and are pruned from the `Map` automatically. The `CacheMap` can also optionally store its data on the filesystem allowing for other running node processes to read from the same cache data (e.g. sharded parallel testing)
- **FileSystemMap** - a `Map` implementation that stores its values in a file on the filesystem allowing multiple node processes to share the map data or to persist the data over multiple iterations
- **fileio** - a constant class providing file system `write`, `readAs<T>` and `getExpiringFileLock` functions to simplify file operations
- **wait** - constant class providing `wait.untilTrue(...)` and `wait.forDuration(number)` functions to allow for non-thread-locking waits
- **verifier** - see: [Testing with the Verifier](#testing-with-the-verifier) section below

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

### Example Logging Plugin
to create your own simple logging plugin that stores all logs until the `dispose` function is called you would implement the code below.

> NOTE: configuration for the below can be added in a object in the `aftconfig.json` named `ondisposeconsolelogger` based on the `key` passed to the `LoggingPlugin` constructor
```typescript
export type OnDisposeConsoleLoggerOptions = Merge<LoggingPluginOptions, {
    maxLogLines?: number;
}>;
export class OnDisposeConsoleLogger extends LoggingPlugin<OnDisposeConsoleLoggerOptions> {
    private _logs: Array<LogMessageData>;
    private _maxLines: number;
    constructor(options?: OnDisposeConsoleLoggerOptions) {
        super(options);
        this._logs = new Array<LogMessageData>();
    }
    get maxLogLines(): number {
        if (!this._maxLines) {
            this._maxLines = this.option('maxLogLines', 100);
        }
        return this._maxLines;
    }
    async log(data: LogMessageData): Promise<void> {
        let l: LoggingLevel = this.level;
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(l) && level != 'none') {
            this._logs.push(data);
            while (this._logs.length > this.maxLogLines) {
                this._logs.shift();
            }
        }
    }
    async logResult(name: string, result: ITestResult): Promise<void> { 
        if (result.status == 'Passed') {
            this.log(LoggingLevel.pass, JSON.stringify(result));
        } else {
            this.log(LogginLevel.fail, JSON.stringify(result));
        }
    }
    async dispose(name: string, error?: Error): Promise<void> { 
        this._logs.forEach((message) => {
            LogManager.toConsole(message);
        });
        if (error) {
            LogManager.toConsole({name: this.logName, level: 'error', message: Err.full(error.message)});
        }
        LogManager.toConsole({name: this.logName, level: 'info', message: 'OnDisposeConsoleLogger is now disposed!'});
    }
}
```

### Example Test Case Plugin (TestRail)
```typescript
export type TestRailTestCasePluginOptions = Merge<TestCasePluginOptions, {
    client?: TestRailClient;
}>;
export class TestRailTestCasePlugin extends TestCasePlugin<TestRailTestCasePluginOptions> {
    private _client: TestRailClient;
    get client(): TestRailClient {
        if (!this._client) {
            this._client = this.option('client') || new TestRailClient();
        }
        return this._client;
    }
    async getTestCase(testId: string): Promise<ITestCase> {
        return await this.client.getTestCase(testId);
    }
    async findTestCases(searchTerm: string): Promise<ITestCase[]> {
        return await this.client.findTestCases(searchTerm);
    }
    async shouldRun(testId: string): Promise<ProcessingResult> {
        return await this.client.shouldRun(testId);
    }
    async dispose(error?: Error) { /* perform some action if needed */ }
}
```
### Example Defect Plugin (Bugzilla)
```typescript
export type BugzillaDefectPluginOptions = Merge<DefectPluginOptions, {
    client?: BugzillaClient;
}>;

export class BugzillaDefectPlugin extends DefectPlugin<BugzillaDefectPluginOptions> {
    private _client: BugzillaClient;
    get client(): TestRailClient {
        if (!this._client) {
            this._client = this.option('client') || new BugzillaClient();
        }
        return this._client;
    }
    async getDefect(defectId: string): Promise<IDefect> {
        return await this.client.getDefect(defectId);
    }
    async findDefects(searchTerm: string): Promise<IDefect[]> {
        return await this.client.findDefects(searchTerm);
    }
    async dispose(error?: Error) { /* perform some action if needed */ }
}
```

## Testing with the Verifier
the `Verifier` class and `verify` functions of `aft-core` enable testing with pre-execution filtering based on integration with external test case and defect managers via plugin packages supporting each (see examples above).

```typescript
describe('Sample Test', () => {
    it('can perform a demonstration of AFT', async () => {
        let feature: FeatureObj = new FeatureObj();
        /**
         * the `verify(assertion).returns(expectation)` function
         * checks any specified `TestCasePlugin`
         * and `DefectPlugin` implementations
         * to ensure the test should be run. It will then
         * report to any `LoggingPlugin` implementations
         * with an `TestResult` indicating the success,
         * failure or skipped status
         */
        await verify(async () => await feature.performAction())
        .withTestId('C1234')
        .and.withKnownDefectId('DEFECT-123')
        .and.withDescription("expect that performAction will return 'result of action'")
        .returns('result of action');
    });
});
```
in the above example, the `await feature.performAction()` call will only be run if a `TestCasePlugin` is loaded and returns `true` from it's `shouldRun(testId: string)` function (or no `TestCasePlugin` is loaded) and if a `DefectPlugin` is loaded and returns either no defect or a `closed` defect from it's `getDefect(defectId: string)` function (or no `DefectPlugin` is loaded). additionally, any logs associated with the above `verify` call will use a `logName` of `"expect_that_performAction_will_return_result_of_action"` resulting in log lines like the following:
```
09:14:01 - [expect that performAction will return 'result of action'] - TRACE - no TestCasePlugin in use so run all tests
09:14:02 - [expect that performAction will return 'result of action'] - TRACE - no DefectPlugin in use so run all tests
```