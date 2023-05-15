# AFT-UI-Mobile-Apps
Automated Functional Testing (AFT) package providing Appium-based `MobileAppFacet extends UiFacet` Plugins and BrowserStack, Sauce Labs and Appium Grid `UiSession` Plugins extending the `aft-ui` package. This enables testing using BrowserStack's, Sauce Labs's or a Local Selenium Grid for any Mobile Device application tests.

## Installation
`> npm i aft-ui-mobile-apps`

## Creating your own Facets for use in testing
Take the following as an example of how one could interact with the following Android App

### Step 1: create the View Facet

```typescript
export class WikipediaView extends MobileAppFacet {
    readonly locator: string = '//*';
    private _searchButton = async (): Promise<Element<'async'>> => await this.getElement({locator: "~Search Wikipedia", maxWaitMs: 10000});
    private _searchInput = async (): Promise<Element<'async'>> => await this.session.driver.$('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")');
    private _searchResults = async (): Promise<ElementArray> => await this.getElements({locator: "android.widget.TextView", maxWaitMs: 10000});
    async searchFor(term: string): Promise<string[]> {
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }
    async sendTextToSearch(text: string): Promise<void> {
        await this._searchInput().then(i => i.addValue(text));
    }
    async getResults(): Promise<string[]> {
        let resultsText: string[] = [];
        var searchResults: ElementArray = await this._searchResults();
        for (var i=0; i<searchResults.length; i++) {
            let res: Element<'async'> = searchResults[i];
            let txt: string = await res.getText().catch(err => err);
            resultsText.push(txt);
        }
        return resultsText;
    }
}
```
### Step 2: use them to interact with the mobile application

```typescript
await verifyWithMobileApp(async (mav: MobileAppVerifier) => {
    await mav.logMgr.step('get the WikipediaView Facet from the Session...');
    let view: WikipediaView = await mav.session.getFacet(WikipediaView);
    await mav.logMgr.step('enter a search term...');
    await view.searchFor('pizza');
    await mav.logMgr.step('get the results and ensure they contain the search term...');
    let results: string[] = await view.getResults();
    let contains: boolean = false;
    for (var i=0; i<results.length; i++) {
        let res: string = results[i];
        if (res.toLowerCase().includes('pizza')) {
            contains = true;
            break;
        }
    }
    return contains;
}).returns(true);
```
## aftconfig.json keys and values supported by aft-ui-mobile-apps package
```
{
    "MobileAppSessionGeneratorManager": {
        "uiplatform": "android_11_+_+_Google Pixel 5",
        "plugins": [{
            "name": "browserstack-mobile-app-session-generator-plugin",
            "searchDirectory": "../node_modules",
            "options": {
                "app": "bs://some-identifier-for-your-uploaded-app",
                "user": "%browserstack_user%",
                "key": "%browserstack_key%",
                "debug": true,
                "local": false,
                "localIdentifier": "abcdefg"
            }
        }, {
            "name": "sauce-labs-mobile-app-session-generator-plugin",
            "searchDirectory": "../node_modules",
            "options": {
                "uiplatform": "android_10_+_+_Samsung Galaxy S7",
                "remoteOptions": {
                    "capabilities": {
                        "your-custom-key": "your-custom-value"
                    }
                },
                "username": "%saucelabs_username%",
                "accessKey": "%saucelabs_accesskey%",
                "tunnel": false,
                "tunnelIdentifier": "abcdefgh"
            }
        }, {
            "name": "appium-grid-session-generator-plugin",
            "options": {
                "url": "http://127.0.0.1:4444/wd/hub",
                "app": "sauce-storage:your-mobile-app.zip",
                "enabled": false
            }
        }]
    }
}
```
- **BrowserStackConfig** - only required if referencing `browserstack-mobile-app-session-generator-plugin` in the `plugins` array of the {
    "name": `MobileAppSessionGeneratorManager` section of your `aftconfig.json` file
  - **user** - [REQUIRED] the BrowserStack username for the account to be used
  - **key** - [REQUIRED] the BrowserStack accesskey for the account to be used
  - **debug** - a `boolean` value indicating if the `browserstack.debug` capability should be included
  - **local** - a `boolean` value indicating if sessions should connect via an already running BrowserStack _Local_ VPN _(defaults to false)_
  - **localIdentifier** - a `string` containing the BrowserStack _Local_ `localIdentifier` to use when connecting to a _Local_ VPN instance. only required if **local** is set to `true` and your _Local_ VPN instance is using a `localIdentifier`
- **SauceLabsConfig** - only required if referencing `sauce-labs-mobile-app-session-generator-plugin` in the `plugins` array of the {
    "name": `MobileAppSessionGeneratorManager` section of your `aftconfig.json` file
  - **username** - [REQUIRED] the Sauce Labs username for the account to be used
  - **accesskey** - [REQUIRED] the Sauce Labs accesskey for the account to be used
  - **tunnel** - a `boolean` value indicating if sessions should connect via an already running Sauce Labs tunnel VPN _(defaults to false)_
  - **tunnelId** - a `string` containing the Sauce Labs `tunnelIdentifier` to use when connecting to a tunnel VPN instance. only required if **tunnel** is set to `true` and your tunnel VPN instance is using a `tunnelIdentifier`
- `sauce-labs-mobile-app-session-generator-plugin` | `browserstack-mobile-app-session-generator-plugin` | `appium-grid-session-generator-plugin`
  - **options**
    - **app** - [REQUIRED] the path to your mobile application (.apk or .ipa) used when uploaded to Sauce Labs
    - **uiplatform** - a `TestPlatform` string like `android_11_+_+_Google Pixel 5` specifying the OS, OS Version and Device to use _(defaults to value set in `MobileAppSessionGenerator.uiplatform`)_
    - **url** - an alternative url for Sauce Labs' grid hub _(only required when using the Appium Grid Plugin)_
    - **remoteOptions** - an `object` containing keys and values to be used when creating your Sauce Labs MobileApp Session. this can be used to override default RemoteOptions.capabilities or to add additional ones _(defaults to none)_