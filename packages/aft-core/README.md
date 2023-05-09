# AFT-Core
the base Automated Functional Testing (AFT) library providing support for Plugins, configuration, and helper classes and functions

## Installation
`> npm i aft-core`

## Configuration
the `aft-core` package contains the `aftConfig` constant class (instance of `new AftConfig()`) for reading in configuration an `aftconfig.json` file at the project root. this configuration can be read as a top-level field using `aftConfig.get('field_name')` or `aftConfig.get('field_name', defaultVal)` and can also be set without actually modifying the values in your `aftconfig.json` using `aftConfig.set('field_name', val)`. additionally, configuration classes can be read using `AftConfig` with the `aftConfig.getSection(ConfigClass)` which will read from your `aftconfig.json` file for a field named `ConfigClass`

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

and if you wish to entirely disregarg the configuration specified in your `aftconfig.json` file you can use the following (still based on the above example):
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
- **wait** - continually retry some action until success or a maximum time elapses
- **using** - automatically call the `dispose` function of a class that implements the `IDisposable` interface when done
- **verify** - a function accepting an `assertion` function that simplifies usage of a `Verifier` within your _Jasmine_ or _Mocha_ tests
- **MachineInfo** - get details of the host machine and user running the tests
- **CacheMap** - a `Map` implementation that stores values with expirations where expired items will not be returned and are pruned from the `Map` automatically. The `CacheMap` can also optionally store its data on the filesystem allowing for other running node processes to read from the same cache data (e.g. sharded parallel testing)
- **FileSystemMap** - a `Map` implementation that stores its values in a file on the filesystem allowing multiple node processes to share the map data or to persist the data over multiple iterations
- **fileio** - a constant class providing file system `write`, `readAs<T>` and `getExpiringFileLock` functions to simplify file operations
- **wait** - constant class providing `wait.forResult<T>(...): Promise<T>`, `wait.forDuration(number)`, and `wait.until(number | Date): Promise<void>` functions to allow for non-thread-locking waits
- **retry** - constant class providing `retry(retryable): Promise<T>` async function
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
export class OnDisposeConsoleLoggerConfig {
    maxLogLines: number = 100;
    logLevel: LogLevel = 'warn';
};
export class OnDisposeConsoleLogger implements ILoggingPlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: 'logging' = 'logging';
    public readonly logLevel: LogLevel;
    public readonly enabled: boolean;
    private readonly _logs: Map<string, Array<LogMessageData>>;
    private readonly _maxLines: number;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(OnDisposeConsoleLoggerConfig);
        this.logLevel = cfg.logLevel ?? 'warn';
        this.enabled = this.logLevel != 'none';
        if (this.enabled) {
            this._logs = new Map<string, Array<LogMessageData>>();
        }
    }
    async initialise(name: string): Promise<void> {
        if (!this._logs.has(name)) {
            this._logs.set(name, new Array<LogMessageData>());
        }
    }
    async log(data: LogMessageData): Promise<void> {
        if (this.enabled) {
            if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.logLevel) && level != 'none') {
                const namedLogs = this._logs.get(data.name);
                namedLogs.push(data);
                while (namedLogs.length > this.maxLogLines) {
                    namedLogs.shift();
                }
            }
        }
    }
    async logResult(name: string, result: ITestResult): Promise<void> { 
        if (this.enabled) {
            if (result?.status == 'Passed') {
                this.log(LoggingLevel.pass, JSON.stringify(result));
            } else {
                this.log(LogginLevel.fail, JSON.stringify(result));
            }
        }
    }
    async finalise(name: string): Promise<void> { 
        if (this.enabled) {
            const namedLogs = this._logs.get(name);
            while (namedLogs?.length > 0) {
                let message = namedLogs.shift();
                LogManager.toConsole(message);
            });
            LogManager.toConsole({name: this.name, level: 'debug', message: 'OnDisposeConsoleLogger is now disposed!'});
        }
    }
}
```

### Example Test Case Plugin (TestRail)
```typescript
export class TestRailTestCasePluginConfig {
    username: string;
    password: string;
    url: string = 'https://you.testrail.io';
    readEnabled: boolean = true;
    writeEnabled: boolean = false;
    projectId: number;
    suiteIds: Array<number> = new Array<number>();
    planId: number;
};
export class TestRailTestCasePlugin implements ITestCasePlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: 'testcase' = 'testcase';
    public readonly enabled: boolean;
    private readonly _client: TestRailClient;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(TestRailTestCasePluginConfig);
        this.enabled = cfg.readEnabled || cfg.writeEnabled;
        if (this.enabled) {
            this._client = new TestRailClient(cfg.url, cfg.username, cfg.password);
        }
    }
    async getTestCase(testId: string): Promise<TestCase> {
        return await this._client.getTestCase(testId);
    }
    async findTestCases(searchCriteria: TestCase): Promise<TestCase[]> {
        return await this._client.findTestCases(searchCriteria);
    }
    async shouldRun(testId: string): Promise<ProcessingResult> {
        const result = await this._client.getLastTestResult(testId);
        if (result.status === 'Passed') {
            return false;
        }
        return true;
    }
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