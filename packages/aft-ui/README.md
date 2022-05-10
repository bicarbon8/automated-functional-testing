# AFT-UI
Automated Functional Testing (AFT) package supporting UI interactions using the Page Object Model (POM) to streamline UI test development and also supporting extension via plugins to support systems such as Selenium and Cypress.

## Installation
`> npm i aft-ui`

## Page Object Model (POM)
the POM is a standard design pattern used in UI and layout testing. AFT-UI supports this model via an `AbstractFacet` class that is made up of one or more `AbstractFacet` classes and / or elements encapsulating logical blocks of functionality on the page. The `aft-ui` package supports development of libraries used to generate UI test sessions (via the `SessionGeneratorManager`, `AbstractSessionGeneratorPlugin`, classes and `ISession` interface).

### Creating a Session Generator Plugin (Selenium)
the `AbstractSessionGeneratorPlugin` implementation is responsible for creating new UI session instances (classes extending from `ISession`)

```typescript
export interface SeleniumSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions { 
    url?: string;
    capabilities?: {};
}

export class SeleniumSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    constructor(options?: SeleniumSessionGeneratorPluginOptions) {
        super('seleniumsessiongeneratorplugin', options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async newSession(options?: ISessionOptions): Promise<SeleniumSession> {
        if (await this.enabled()) {
            if (!options?.driver) {
                try {
                    let url: string = options?.url || 'http://127.0.0.1:4444/';
                    let caps: Capabilities = new Capabilities(options?.capabilities || {});
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
        return null;
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}
```

### Create an `ISession` implementation (Selenium)
the `ISession` implementation is used to keep reference to the running UI session as well as to create instances of the logical UI groups (`AbstractFacet`) which manage interactions with the UI elements

```typescript
export interface SeleniumSessionOptions extends ISessionOptions {
    driver?: WebDriver; // overrides 'unknown' driver type from 'ISessionOptions'
}

export class SeleniumSession implements ISession {
    readonly driver: WebDriver; // overrides 'unknown' driver type from 'ISession'
    readonly logMgr: LogManager;
    constructor(options: SeleniumSessionOptions) {
        this._driver = options.driver;
        this.logMgr = options.logMgr || new LogManager();
    }
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: IFacetOptions): Promise<T> {
        options = options || {};
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
            this.logMgr.warn(`Error: SeleniumSession - ${error.message}`);
        }
        this.logMgr.trace('shutting down SeleniumSession');
        await this.driver?.quit();
    }
}
```

### Create an `AbstractFacet` implementation (Selenium)
the `AbstractFacet` represents a logical container / section of the UI and is responsible for providing a resilient lookup mechanism for sub-facets or individual elements in the UI
```typescript
export interface SeleniumFacetOptions extends IFacetOptions {
    locator?: Locator; // overrides 'unknown' type from 'IFacetOptions'
    session?: SeleniumSession; // overrides 'ISession' type from 'IFacetOptions'
    parent?: SeleniumFacet; // overrides 'AbstractFacet' type from 'IFacetOptions'
}

export interface WebElementOptions extends IElementOptions {
    locator: Locator; // overrides 'unknown' type from 'IElementOptions'
}

export class SeleniumFacet extends AbstractFacet {
    readonly locator: Locator; // overrides 'unknown' type from 'AbstractFacet'
    readonly session: SeleniumSession; // overrides 'ISession' type from 'AbstractFacet'
    readonly parent: SeleniumFacet; // overrides 'AbstractFacet' type from 'AbstractFacet'
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
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: SeleniumFacetOptions): Promise<T> {
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
- **sessiongeneratormanager** - allows for specifying which `AbstractSessionGeneratorPlugin` implementations should be loaded and optionally what `TestPlatform` should be used
  - **pluginNames** - a `string[]` of names for `AbstractSessionGeneratorPlugin` implementations to load. only one can be used at any given time, but multiple can be listed with the top-most being used unless specifically not enabled
  - **platform** - an optional `TestPlatform` object listing the _OS_, _OS version_, _Browser_, _Browser version_, and _Device name_ to use when creating new sessions. if not specified here, this value must be specified in the configuration section for the loaded `AbstractSessionGeneratorPlugin`