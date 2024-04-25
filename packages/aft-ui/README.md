# AFT-UI
Automated Functional Testing (AFT) package supporting UI testing via plugins supporting the `UiSessionGeneratorPlugin` base class as well as providing

## Installation
`> npm i aft-ui`

## Page Object Model (POM)
the POM is a standard design pattern used in UI and layout testing. AFT-UI supports this model via an `UiComponent` class that is made up of one or more `UiComponent` classes and / or elements encapsulating logical blocks of functionality on the page. The `aft-ui` package supports UI session instantiation as well as development of libraries used to generate UI test sessions (via the `UiSessionGeneratorManager`, `UiSessionGeneratorPlugin`, classes).

### Creating a Session Generator Plugin (BrowserStack)
the `UiSessionGeneratorPlugin` implementation is responsible for creating new UI session instances

```typescript
export class BrowserStackAutomateConfig {
    uiplatform: UiPlatform;
    url: string = 'https://hub-cloud.browserstack.com/wd/hub/';
    api: string = 'https://api.browserstack.com/automate/';
    username: string;
    accessKey: string;
}
export class BrowserStackAutomateSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const cfg = this.aftCfg.getSection(BrowserStackAutomateConfig);
        let caps: Capabilities = await this.getCapabilities();
        caps = merge(caps, sessionOptions); // using lodash merge
        return await new Builder()
            .usingServer(cfg.url)
            .withCapabilities(caps)
            .build();
    }
    async getCapabilities(): Promise<Capabilities> {
        const bsc = this.aftCfg.getSection(BrowserStackConfig);
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = bsc.uiplatform;
        capabilities.set('browserstack.user', bsc.username);
        capabilities.set('browserstack.key', bsc.accessKey);
        capabilities.set('platform', platform.os);
        capabilities.set('platform_version', platform.osVersion)
        capabilities.set('browserName', platform.browser);
        capabilities.set('browser_version', platform.browserVersion);
        return capabilities;
    }
}
```

## aftconfig.json keys and values supported by aft-ui-selenium package

**GridSessionGeneratorPlugin Example using BrowserStack:**
the `aft-ui-selenium` package contains a `UiSessionGeneratorPlugin` called `grid-session-generator-plugin` which the below example uses to demonstrate configuration supported by `aft-ui`. this is not to be confused with the above example demonstrating how a BrowserStack `UiSessionGeneratorPlugin` could be created using `aft-ui`.
```json
// aftconfig.json
{
    "UiSessionConfig": {
        "generatorName": "grid-session-generator-plugin",
        "options": {
            "url": "https://hub-cloud.browserstack.com/wd/hub",
            "capabilities": {
                "browserName": "android",
                "platformName": "android",
                "appium:platformVersion": "13.0",
                "appium:deviceName": "Samsung Galaxy S23",
                "appium:app": "bs://some-identifier-for-your-uploaded-app",
                "bstack:options": {
                    "userName": "yourBrowserStackUser",
                    "accessKey": "yourBrowserStackAccessKey",
                    "debug": true
                }
            }
        }
    }
}
```
- **generatorName** - a `string` containing the class name (optionally separated using `-` characters) that is used to get the specific `UiSessionGeneratorPlugin` implementation to be used
- **options** - an `object` containing values that will be passed in to any `UiSessionGeneratorPlugin.getSession(sessionOptions)` call. it is up to the plugin to handle this data and the structure will be defined by the plugin being used. _the example above assumes a usage of the `grid-session-generator-plugin` from `aft-ui-selenium` to connect to BrowserStack's Automate service_
