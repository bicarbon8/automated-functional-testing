# AFT-SELENIUM
Automated Functional Testing (AFT) package supporting Selenium interactions using the Page Object Model (POM) to streamline UI test development and also supporting extension via plugins to support systems such as Selenium and Cypress.

## Installation
`> npm i aft-selenium`

## Page Object Model (POM)
the POM is a standard design pattern used in UI and layout testing. AFT-UI supports this model via an `UiComponent` class that is made up of one or more `UiComponent` classes and / or elements encapsulating logical blocks of functionality on the page. The `aft-selenium` package supports local and remote Selenium WebDriver instantiation as well as development of libraries used to generate UI test sessions (via the `UiSessionGeneratorManager`, `UiSessionGeneratorPlugin`, classes).

### Creating a Session Generator Plugin (BrowserStack)
the `UiSessionGeneratorPlugin` implementation is responsible for creating new UI session instances (classes extending from `WebDriver`)

```typescript
export class BrowserStackAutomateConfig {
    uiplatform: UiPlatform;
    url: string = 'https://hub-cloud.browserstack.com/wd/hub/';
    api: string = 'https://api.browserstack.com/automate/';
    username: string;
    accessKey: string;
}
export class BrowserStackAutomateSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (aftCfg?: AftConfig): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const cfg = aftCfg.getSection(BrowserStackAutomateConfig);
        const caps: Capabilities = await this.getCapabilities(aftCfg);
        return await new Builder()
            .usingServer(cfg.url)
            .withCapabilities(caps)
            .build();
    }
    async getCapabilities(aftCfg?: AftConfig): Promise<Capabilities> {
        aftCfg ??= this.aftCfg;
        const bsc = aftCfg.getSection(BrowserStackConfig);
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

## aftconfig.json keys and values supported by aft-selenium package

**GridSessionGeneratorPlugin Example using BrowserStack:**
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

> NOTE: if using the `LocalBrowserSessionGeneratorPlugin` you may also need to include npm package references to your Browser Driver package such as `ChromeDriver`