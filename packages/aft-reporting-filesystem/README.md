# AFT-reporting-Filesystem
Automated Functional Testing (AFT) package providing a Filesystem Logging Plugin that generates .log files based on the `Reporter.logName` and appends log lines using a customisable date format

## Installation
`> npm i aft-reporting-filesystem`

## Configuration
this plugin accepts configuration options in the following format:

`aftconfig.json`
```json
{
    "pluginsSearchDir": "../node_modules",
    "pluginNames": [
      "filesystem-reporting-plugin"
    ],
    "FilesystemReportingPluginConfig": {
        "logLevel": "trace",
        "outputPath": "./full/path/or/relative/path/to/directory",
        "includeResults": false,
        "dateFormat": "YYYY-MM-DD HH:mm:ss.SSS"
    }
}
```
- **logLevel** - a `string` containing a valid `LogLevel` _(defaults to `trace` if not set)_
- **outputPath** - a `string` with either an absolute path or a relative path from the `process.cwd()` where .log files will be created _(defaults to `path.join(process.cwd(), 'logs')`)_
- **includeResults** - a `boolean` indicating whether calls to any `Reporter.logResult` function will output the `TestResult` to the .log file _(defaults to `true`)_
- **dateFormat** - a `string` that can include Date Formatting as outlined at the [date-and-time](https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc) npm package

## Log Format
all log files are written using UTF-8 encoding and by default will resemble the following:

`./logs/your_value_for_LogName.log`
```
[2022-06-29 18:18:50.773] - STEP - 1: navigate to LoginPage...
[2022-06-29 18:18:52.524] - STEP - 2: login
[2022-06-29 18:18:53.089] - INFO - sending tomsmith to the Username Input
[2022-06-29 18:18:53.345] - INFO - username entered
[2022-06-29 18:18:53.942] - INFO - sending SuperSecretPassword! to the Password Input
[2022-06-29 18:18:54.241] - INFO - password entered
[2022-06-29 18:18:54.262] - INFO - clicking Login Button...
[2022-06-29 18:18:55.495] - INFO - Login Button clicked
[2022-06-29 18:18:55.516] - STEP - 3: wait for message to appear...
[2022-06-29 18:18:56.006] - STEP - 4: get message...
[2022-06-29 18:18:57.191] - PASS - C3456
[2022-06-29 18:18:57.212] - PASS - C2345
[2022-06-29 18:18:57.232] - PASS - C1234
[2022-06-29 18:18:57.257] - PASS - {"testId":"C3456","created":1656523137189,"resultId":"b259d87b-ccb6-4ace-b3a8-9ea08a8f578d","status":"Passed","metadata":{"durationMs":13168,"buildName":"unknown","buildNumber":"unknown"}}
[2022-06-29 18:18:57.277] - PASS - {"testId":"C2345","created":1656523137253,"resultId":"3f404419-1240-44fe-b6e1-e1072f5af787","status":"Passed","metadata":{"durationMs":13231,"buildName":"unknown","buildNumber":"unknown"}}
[2022-06-29 18:18:57.298] - PASS - {"testId":"C1234","created":1656523137255,"resultId":"6be91db1-9523-434f-8349-a1a19e2ed282","status":"Passed","metadata":{"durationMs":13233,"buildName":"unknown","buildNumber":"unknown"}}
[2022-06-29 18:18:57.932] - DEBUG - closing driver instance...
[2022-06-29 18:18:58.985] - DEBUG - driver instance closed.
```