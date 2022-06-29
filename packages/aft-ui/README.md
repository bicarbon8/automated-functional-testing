# AFT-UI
Automated Functional Testing (AFT) package supporting UI interactions using the Page Object Model (POM) to streamline UI test development and also supporting extension via plugins to support systems such as Selenium and Cypress.

> **!!WARNING!!**
this package is only for those who know what they're doing and are familiar with AFT internals. it is intended as a base to be consumed by packages implementing support for UI test session creation (such as Selenium)

## Installation
`> npm i aft-ui`

## Page Object Model (POM)
the POM is a standard design pattern used in UI and layout testing. AFT-UI supports this model via an `UiFacet` class that is made up of one or more `UiFacet` classes and / or elements encapsulating logical blocks of functionality on the page. The `aft-ui` package supports development of libraries used to generate UI test sessions (via the `UiSessionGeneratorManager`, `UiSessionGeneratorPlugin`, classes and `UiSession` interface).

### Creating a Session Generator Plugin (Selenium)
the `UiSessionGeneratorPlugin` implementation is responsible for creating new UI session instances (classes extending from `UiSession`)

```typescript
export type SeleniumSessionGeneratorPluginOptions = Merge<UiSessionGeneratorPluginOptions, { 
    url?: string;
    additionalCapabilities?: object;
}>;

export class SeleniumSessionGeneratorPlugin extends UiSessionGeneratorPlugin<SeleniumSessionGeneratorPluginOptions> {
    override async newUiSession(options?: SeleniumSessionOptions): Promise<SeleniumSession> {
        if (!options?.driver) {
            try {
                let url: string = this.option('url', 'http://127.0.0.1:4444/');
                let caps: Capabilities = new Capabilities(this.option('additionalCapabilities', {}));
                let driver: WebDriver = await new Builder()
                    .usingServer(url)
                    .withCapabilities(caps)
                    .build();
                await driver.manage().setTimeouts({implicit: 1000});
                await driver.manage().window().maximize();
                return new SeleniumSession({
                    driver: driver,
                    logMgr: options?.logMgr || this.logMgr
                });
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return new SeleniumSession({driver: options.driver, logMgr: options.logMgr || this.logMgr});
    }
}
```

### Create a `UiSession` implementation (Selenium)
the `UiSession` implementation is used to keep reference to the running UI session as well as to create instances of the logical UI groups (`UiFacet`) which manage interactions with the UI elements

```typescript
export type SeleniumSessionOptions = Merge<UiSessionOptions, {
    driver?: WebDriver;
}>;

export class SeleniumSession implements UiSession<SeleniumSessionOptions> {
    readonly driver: WebDriver; // overrides 'unknown' driver type from 'UiSession'
    readonly logMgr: LogManager;
    constructor(options: SeleniumSessionOptions) {
        this._driver = options.driver;
        this.logMgr = options.logMgr || new LogManager({logName: this.constructor.name});
    }
    async getFacet<T extends UiFacet<To>, To extends UiFacetOptions>(facetType: Class<T>, options?: To): Promise<T> {
        options = options || {} as To;
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: T = new facetType(options);
        return facet;
    }
    async goTo(url: string): Promise<SeleniumSession> {
        try {
            await this.driver?.get(url);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    async refresh(): Promise<SeleniumSession> {
        try {
            await this.driver?.navigate().refresh();
        } catch (e) {
            return Promise.reject(e);
        }
    }
    async resize(width: number, height: number): Promise<SeleniumSession> {
        try {
            await this.driver?.manage().window().setSize(width, height);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    async dispose(error?: Error): Promise<void> {
        if (error) {
            await this.logMgr.warn(`Error: SeleniumSession - ${error.message}`);
        }
        await this.logMgr.trace('shutting down SeleniumSession');
        await this.driver?.quit();
    }
}
```

### Create an `UiFacet` implementation (Selenium)
the `UiFacet` represents a logical container / section of the UI and is responsible for providing a resilient lookup mechanism for sub-facets or individual elements in the UI
```typescript
export type SeleniumFacetOptions = Merge<UiFacetOptions, {
    locator?: Locator; // overrides 'unknown' type from 'UiFacetOptions'
    session?: SeleniumSession; // overrides 'UiSession' type from 'UiFacetOptions'
    parent?: SeleniumFacet; // overrides 'UiFacet' type from 'UiFacetOptions'
}>;

export type WebElementOptions = Merge<UiElementOptions, {
    locator: Locator; // overrides 'unknown' type from 'UiElementOptions'
}>;

export class SeleniumFacet extends UiFacet<SeleniumSessionOptions> {
    readonly locator: Locator; // overrides 'unknown' type from 'UiFacet'
    readonly session: SeleniumSession; // overrides 'UiSession' type from 'UiFacet'
    readonly parent: SeleniumFacet; // overrides 'UiFacet' type from 'UiFacet'
    async getElements(options: WebElementOptions): Promise<WebElement[]> {
        let elements: WebElement[]
        await wait.untilTrue(async () => {
            elements = await this.getRoot().then(r => r.findElements(options.locator));
            return elements.length > 0;
        }, options.maxWaitMs || 0);
        return elements;
    }
    async getElement(options: WebElementOptions): Promise<WebElement> {
        let element: WebElement;
        await wait.untilTrue(async () => {
            element = await this.getRoot().then(r => r.findElement(options.locator));
            return !!element;
        }, options.maxWaitMs || 0);
        return element;
    }
    async getFacet<T extends UiFacet<To>, To extends UiFacetOptions>(facetType: Class<T>, options?: To): Promise<T> {
        options = options || {};
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        let facet: T = new facetType(options);
        return facet;
    }
    async getRoot(): Promise<WebElement>  {
        let el: WebElement;
        await wait.untilTrue(async () => {
            let parent = this.parent;
            if (parent) {
                let els: WebElement[] = await parent.getRoot()
                    .then(r => r.findElements(this.locator));
                el = els[this.index];
            } else {
                let els: WebElement[] = await this.session.driver.findElements(this.locator));
                el = els[this.index];
            }
            if (el) {
                return true;
            }
            return false;
        }, this.maxWaitMs);
        return el;
    }
}
```
## aftconfig.json keys and values supported by aft-ui package
this package is an abstract base to be extended by other packages providing support for UI testing so no configuration is expected. that said, the base options provided for packages extending this one will be:

**UiSessionGeneratorPlugin**
```json
{
    "uiplatform": "android_11_chrome_99_Google Pixel XL"
}
```
- **uiplatform** - a `string` of `_` delimited values representing the `OS`, `OS Version`, `Browser`, `Browser Version`, and `Mobile Device` to be used for the UI session. any of the values may be replaced with `+` meaning any value and an empty `uiplatform` is equivalent to a string of `+_+_+_+_+`