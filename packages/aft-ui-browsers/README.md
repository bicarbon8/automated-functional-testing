# AFT-UI-Selenium
Automated Functional Testing (AFT) package providing Selenium-based `SeleniumFacet extends AbstractFacet` Plugins and BrowserStack, Sauce Labs and Selenium Grid `ISession` Plugins extending the `aft-ui` package. This enables testing using BrowserStack's, Sauce Labs's or a Local Selenium Grid for any Browser application tests.

## Installation
`> npm i aft-ui-selenium`

## Page Object Model (POM)
the POM is a standard design pattern used in UI and layout testing. AFT-UI supports this model via _Sessions_ and _Facets_ where the _Session_ is an object extending from `ISession` and is responsible for managing the UI container (browser, mobile view, etc.)and the _Facet_ is an object extending from `AbstractFacet` and is responsible for managing logical collections of sub-facets and elements in the UI. For example:
![aft-ui-pom](aft-ui-pom.png)
The above would use a POM design like:

**Session** - `BrowserSession`
- **Page Facet** - `BrowserFacet`
  - _logo element_ - `WebElement`
  - **Breadcrumbs Facet** - `BrowserFacet`
    - _breadcrumb links_ - `WebElement[]`
  - _avatar element_ - `WebElement`
  - **Nav Facet** - `BrowserFacet`
    - _nav elements_ - `WebElement[]`
  - **Tabs Facet** - `BrowserFacet`
    - **Tab Facet 1** - `BrowserFacet`
    - **Tab Facet 2** - `BrowserFacet`
      - **Table Facet** - `BrowserFacet`
        - _header elements_ - `WebElement[]`
        - _cell elements_ - `WebElement[]`
    - **Tab Facet 3** - `BrowserFacet`
  - _media element_ - `WebElement`

## Creating your own Facets for use in testing
Take the following as an example of how one could interact with the following page https://the-internet.herokuapp.com/login

### Step 1: create the Page Facet

```typescript
/**
 * represents the login page object containing widgets encapsulating
 * the functionality of the website
 */
export class HerokuLoginPage extends SeleniumFacet {
    /* the locator can also be specified in options */
    readonly locator: Locator = By.css('html');
    /* facets contained in this page */
    private content(): Promise<HerokuContentFacet> {
        return this.getFacet(HerokuContentWidget);
    }
    private messages(): Promise<HerokuMessagesFacet> {
        return this.getFacet(HerokuMessagesWidget, {maxWaitMs: 20000});
    }
    async navigateTo(): Promise<void> {
        await this.session.goTo('https://the-internet.herokuapp.com/login');
    }
    /* action functions */
    async login(user: string, pass: string): Promise<void> {
        await this.content().then((c) => c.login(user, pass));
    }
    async hasMessage(): Promise<boolean> {
        return await this.messages().then((m) => m.hasMessage());
    }
    async getMessage(): Promise<string> {
        return await this.messages().then((m) => m.getMessage());
    }
}
```

### Step 2: create the content and messages Facets

```typescript
/**
 * represents the content of the login page including the 
 * username and password fields and the login button
 */
export class HerokuContentFacet extends SeleniumFacet {
    readonly locator: Locator = By.id("content");
    /**
     * function will get the Facet's root element using
     * the Facet.locator (By.id("content")) and then will
     * call {findElement(By.id("username"))} from that
     * ```
     * <html>
     *   ...
     *   <div id="content">
     *     <input id="username" />
     *   </div>
     *   ...
     * </html>
     * ```
     */
    private async usernameInput(): Promise<WebElement> {
        return await this.getElement({locator: By.id("username")});
    }
    private async passwordInput(): Promise<WebElement> {
        return await this.getElement({locator: By.id("password")});
    }
    private async loginButton(): Promise<IFacet> {
        return await this.getElement({locator: By.css("button.radius")});
    }
    /* action functions */
    async login(user: string, pass: string): Promise<void> {
        await this.usernameInput().then(async (input) => await input.sendKeys(user));
        await this.passwordInput().then(async (input) => await input.sendKeys(pass));
        return await this.clickLoginButton();
    }
    async clickLoginButton(): Promise<void> {
        await this.loginButton().then(async (button) => await button.click());
    }
}
```
```typescript
/**
 * represents the results message content shown on successful 
 * or failed login.
 */
export class HerokuMessagesFacet extends SeleniumFacet {
    readonly locator: Locator = By.id("flash-messages");
    private async message(): Promise<WebElement> {
        return this.getElement({locator: By.id("flash")});
    }
    /* action functions */
    async hasMessage(): Promise<boolean> {
        return await this.message()
        .then((message) => {
            return message !== undefined;
        }).catch((err: Error) => {
            return false;
        });
    }
    async getMessage(): Promise<string> {
        if (await this.hasMessage()) {
            return await this.message().then(m => m.getText());
        }
        return null;
    }
}
```
### Step 3: use them to interact with the web application

```typescript
await verifyWithBrowser(async (bv: BrowserVerifier) => {
    let loginPage: HerokuLoginPage = await bv.session.getFacet(HerokuLoginPage);
    await bv.logMgr.step('navigate to LoginPage...');
    await loginPage.navigateTo();
    await bv.logMgr.step('login');
    await loginPage.login("tomsmith", "SuperSecretPassword!");
    await bv.logMgr.step('wait for message to appear...')
    await wait.untilTrue(() => loginPage.hasMessage(), 20000);
    await bv.logMgr.step('get message...');
    return await loginPage.getMessage();
}).withDescription('can access websites using AFT and Page Widgets and Facets')
.and.withTestId('C3456').and.withTestId('C2345').and.withTestId('C1234')
.returns("You logged into a secure area!");
```
## aftconfig.json keys and values supported by aft-ui-selenium package
```
{
    "browsersessiongeneratorpluginmanager": {
        "pluginNames": [
            "browserstack-browser-session-generator-plugin",
            "saucelabs-browser-session-generator-plugin",
            "selenium-grid-session-generator-plugin"
        ],
        "searchDir": "../"
    },
    "browserstackconfig": {
        "user": "%browserstack_user%",
        "key": "%browserstack_key%",
        "debug": true,
        "resolution": "640x480",
        "local": false,
        "localIdentifier": "abcdefg"
    },
    "browserstackbrowsersessiongeneratorplugin": {
        "enabled": true,
        "platform": "windows_10_chrome"
    },
    "saucelabsconfig": {
        "username": "%saucelabs_username%",
        "accessKey": "%saucelabs_accesskey%",
        "resolution": "1024x768",
        "tunnel": false,
        "tunnelId": "abcdefgh"
    },
    "saucelabsbrowsersessiongeneratorplugin": {
        "enabled": true,
        "platform": "windows_10_chrome"
    },
    "seleniumgridsessiongeneratorplugin": {
        "enabled": true,
        "url": "http://127.0.0.1:4444/wd/hub",
        "platform": "windows_10_chrome",
        "capabilities": {
            
        }
    }
}
```
- **browserstackconfig** - only required if referencing `browserstack-browser-session-generator-plugin` in the `pluginNames` array of the `browsersessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **user** - [REQUIRED] the BrowserStack username for the account to be used
  - **key** - [REQUIRED] the BrowserStack accesskey for the account to be used
  - **resolution** - a `string` containing a valid resolution for your BrowserStack session like: `1024x768` _(defaults to no value so BrowserStack will choose)_
  - **local** - a `boolean` value indicating if sessions should connect via an already running BrowserStack _Local_ VPN _(defaults to false)_
  - **localIdentifier** - a `string` containing the BrowserStack _Local_ `localIdentifier` to use when connecting to a _Local_ VPN instance. only required if **local** is set to `true` and your _Local_ VPN instance is using a `localIdentifier`
- **browserstackbrowsersessiongeneratorplugin** - only required if referencing `browserstack-browser-session-generator-plugin` in the `pluginNames` array of the `browsersessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **platform** - a `TestPlatform` string used to define what OS and Browser combination is to be generated
  - **url** - an alternative url for BrowserStack's grid hub _(defaults to `https://hub-cloud.browserstack.com/wd/hub/` if not specified)_
  - **capabilities** - an `object` containing keys and values to be used when creating your BrowserStack Session. this can be used to override default capabilities or to add additional ones _(defaults to none)_
- **saucelabsconfig** - only required if referencing `sauce-labs-browser-session-generator-plugin` in the `pluginNames` array of the `browsersessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **username** - [REQUIRED] the Sauce Labs username for the account to be used
  - **accesskey** - [REQUIRED] the Sauce Labs accesskey for the account to be used
  - **resolution** - a `string` containing a valid resolution for your Sauce Labs session like: `1024x768` _(defaults to no value so Sauce Labs will choose)_
  - **tunnel** - a `boolean` value indicating if sessions should connect via an already running Sauce Labs tunnel VPN _(defaults to false)_
  - **tunnelId** - a `string` containing the Sauce Labs `tunnelIdentifier` to use when connecting to a tunnel VPN instance. only required if **tunnel** is set to `true` and your tunnel VPN instance is using a `tunnelIdentifier`
- **saucelabsbrowsersessiongeneratorplugin** - only required if referencing `sauce-labs-browser-session-generator-plugin` in the `pluginNames` array of the `browsersessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **platform** - a `TestPlatform` string used to define what OS and Browser combination is to be generated
  - **url** - an alternative url for Sauce Labs' grid hub _(defaults to `https://ondemand.us-east-1.saucelabs.com/wd/hub/` if not specified)_
  - **capabilities** - an `object` containing keys and values to be used when creating your Sauce Labs Session. this can be used to override default capabilities or to add additional ones _(defaults to none)_
- **seleniumgridsessiongeneratorplugin** - only required if referencing `selenium-grid-session-generator-plugin` in the `pluginNames` array of the `browsersessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **platform** - a `TestPlatform` string used to define what OS and Browser combination is to be generated
  - **url** - [REQUIRED] the url of your running Selenium Grid instance
  - **capabilities** - an `object` containing keys and values to be used when creating your Browser Session