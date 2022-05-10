# AFT-Core
the base AFT library providing support for Plugins and some test configuration and helper classes and functions

## Installation
`> npm i aft-core`

## Configuration
the `aft-core` package contains classes for reading in configuration from a .json file and performing automatic environment variable replacements on values read in from configuration.
- **aftconfig** - provides functions for reading in .json files and extracting environment variables from values. setting a field's value to `"%your_env_var%"` will instruct `aftconfig` to read in the value of `your_env_var` from the environment variables and return this value when you request the field from your configuration
- **OptionsManager** - provides support for passing in options objects with fallback to configuration file sections with a final fallback to an optional default value.

```json
{
    "config-section-name": {
        "config-field1": "%your_env_var%",
        "config-field2": "some-value"
    }
}
```

## Helpers / Utilities
the `aft-core` package contains several helper and utility classes, interfaces and functions to make functional testing and test development easier. These include:
- **rand** - random string, boolean, number and uuid generation
- **convert** - string manipulation like Base64 encode / decode and replacement
- **ellide** - string elliding supporting beginning, middle and end ellipsis
- **wait** - continually retry some action until success or a maximum time elapses
- **using** - automatically call the `dispose` function of a class that implements the `IDisposable` interface when done
- **verify** - a function accepting an `assertion` function that simplifies usage of a `Verifier` within your _Jasmine_ or _Mocha_ tests
- **MachineInfo** - get details of the host machine and user running the tests
- **OptionsManager** - read in configuration settings from a passed in `object` with fallback to the `aftconfig.json` file which enables specifying environment variables for values
- **Action&lt;T&gt;** - a function accepting one typed argument `T` and returning `void`
- **Func&lt;T, Tr&gt;** - a function accepting one typed argument `T` and returning a specified type `Tr`
- **Clazz&lt;T&gt;** - a class of type `T` accepting 0 or more arguments on the constructor

## Plugins

### Example Logging Plugin
to create your own simple logging plugin that stores all logs until the `dispose` function is called you would implement the code below.

> NOTE: configuration for the below can be added in a object in the `aftconfig.json` named `ondisposeconsolelogger` based on the `key` passed to the `AbstractLoggingPlugin` constructor
```typescript
export class OnDisposeConsoleLogger extends AbstractLoggingPlugin {
    private _logs: string[];
    constructor(options?: ILoggingPluginOptions) {
        super('ondisposeconsolelogger', options);
        this._logs = [];
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async log(level: LoggingLevel, message: string): Promise<void> {
        if (await this.enabled()) {
            let l: LoggingLevel = await this.level();
            if (level.value >= l.value && level != LoggingLevel.none) {
                this._logs.push(`${level.logString} - ${message}`);
            }
        }
    }
    async logResult(result: ITestResult): Promise<void> { 
        if (result.status.Passed) {
            this.log(LoggingLevel.pass, JSON.stringify(result));
        } else {
            this.log(LogginLevel.fail, JSON.stringify(result));
        }
    }
    async dispose(error?: Error): Promise<void> { 
        console.log(`[${await this.name()}]`);
        this._logs.forEach((message) => {
            console.log(message);
        });
        if (error) {
            console.error(`ERROR: ${error.message}`);
        }
        console.log('OnDisposeConsoleLogger is now disposed!');
    }
}
```

### Example Test Case Plugin (TestRail)
```typescript
export class TestRailTestCasePlugin extends AbstractTestCasePlugin {
    private _client: TestRailClient;
    constructor(options?: ITestCasePluginOptions) {
        super('testrailtestcaseplugin', options);
        this._client = new TestRailClient();
    }
    async onLoad(): Promise<void> { /* perform some action if needed */ }
    async getTestCase(testId: string): Promise<ITestCase> {
        return await this._client.getTestCase(testId);
    }
    async findTestCases(searchTerm: string): Promise<ITestCase[]> {
        return await this._client.findTestCases(searchTerm);
    }
    async shouldRun(testId: string): Promise<ProcessingResult> {
        return await this._client.shouldRun(testId);
    }
    async dispose(error?: Error) { /* perform some action if needed */ }
}
```
### Example Defect Plugin (Bugzilla)
```typescript
export class BugzillaDefectPlugin extends AbstractDefectPlugin {
    private _client: BugzillaClient;
    constructor(options?: IDefectPluginOptions) {
        super('bugzilladefectplugin', options)
        this._client = new BugzillaClient();
    }
    async onLoad(): Promise<void> { /* perform some action if needed */ }
    async getDefect(defectId: string): Promise<IDefect> {
        return await this._client.getDefect(defectId);
    }
    async findDefects(searchTerm: string): Promise<IDefect[]> {
        return await this._client.findDefects(searchTerm);
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
         * checks any specified `AbstractTestCasePlugin`
         * and `AbstractDefectPlugin` implementations
         * to ensure the test should be run. It will then
         * report to any `AbstractLoggingPlugin` implementations
         * with an `ITestResult` indicating the success,
         * failure or skipped status
         */
        await verify(async () => await feature.performAction())
        .withTestId('C1234')
        .and.withKnownDefectId('DEFECT-123')
        .and.withDescription('expect that performAction will return \'result of action\'')
        .returns('result of action');
    });
});
```