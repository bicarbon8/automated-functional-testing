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
- **using** - automatically call the `dispose` function of a class that implements the `IDisposable` interface when done
- **MachineInfo** - get details of the host machine and user running the tests
- **CacheMap** - a `Map` implementation that stores values with expirations where expired items will not be returned and are pruned from the `Map` automatically. The `CacheMap` can also optionally store its data on the filesystem allowing for other running node processes to read from the same cache data (e.g. sharded parallel testing)
- **FileSystemMap** - a `Map` implementation that stores its values in a file on the filesystem allowing multiple node processes to share the map data or to persist the data over multiple iterations
- **fileio** - a constant class providing file system `write` and `readAs<T>` functions to simplify file operations
- **wait** - constant class providing `wait.forResult<T>(...): Promise<T>`, `wait.forDuration(number)`, and `wait.until(number | Date): Promise<void>` functions to allow for non-thread-locking waits
- **retry** - constant class providing `retry(retryable): Promise<T>` async function that will retry a given `retryable` function until it succeeds or some condition such as number of attempts or elapsed time is exceeded
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

> NOTE: configuration for the below can be added in a object in the `aftconfig.json` named `OnDisposeConsoleLoggerConfig` and optionally containing values for the supported properties of the `OnDisposeConsoleLoggerConfig` class
```typescript
export class OnDisposeConsoleLoggerConfig {
    maxLogLines: number = Infinity;
    logLevel: LogLevel = 'warn';
};
export class OnDisposeConsoleLogger extends ReportingPlugin {
    public override get logLevel(): LogLevel { return this._lvl; }
    private readonly _lvl: LogLevel;
    private readonly _logs: Map<string, Array<LogMessageData>>;
    private readonly _maxLines: number;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(OnDisposeConsoleLoggerConfig);
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
    override log = async (name: string, level: LogLevel, message: string, ...data: Array<any>): Promise<void> => {
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

### Example TestExecutionPolicyPlugin (TestRail)
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
export class TestRailTestExecutionPolicyPlugin extends TestExecutionPolicyPlugin {
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
### Example ResultsPlugin (HTML Results File)
```typescript
export class HtmlResultsPluginConfig {
    directory: string = path.join(process.cwd(), 'Results');
    fileName: string = 'testResults.html';
    enabled: boolean = false;
}
export class HtmlResultsPlugin extends ResultsPlugin {
    private readonly _dir: string;
    private readonly _file: string;
    private readonly _enabled: boolean;
    private readonly _results: Array<TestResult>;
    public override get enabled(): boolean { return this._enabled; }
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const hrpc = this.aftCfg.getSection(HtmlResultsPluginConfig);
        this._enabled = hrpc.enabled ?? false;
        if (this.enabled) {
            this._results = new Array<TestResult>();
            this._dir = hrpc.directory;
            this._file = hrpc.fileName ?? 'testResults.html';
        }
    }
    override submitResult = async (result: TestResult): Promise<void> => {
        this._results.push(result);
        const lock = ExpiringFileLock.get(this.constructor.name);
        try {
            const htmlTemplate = TEMPLATE_FILE;
            htmlTemplate.replace('{results}', JSON.stringify(this._results))
            fileio.write(path.join(this.dir, this.file), htmlTemplate);
        } finally {
            lock.unlock();
        }
    }
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
         * report to any `ReportingPlugin` implementations
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