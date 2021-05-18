# AFT-UI-Mobile-Apps
Automated Functional Testing (AFT) package providing Appium-based `MobileAppFacet extends AbstractFacet` Plugins and BrowserStack, Sauce Labs and Appium Grid `ISession` Plugins extending the `aft-ui` package. This enables testing using BrowserStack's, Sauce Labs's or a Local Selenium Grid for any Mobile Device application tests.

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
        await this.logMgr.info("tapping on 'SearchButton'");
        await this._searchButton().then(async b => await b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }
    async sendTextToSearch(text: string): Promise<void> {
        await this.logMgr.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput().then(async i => await i.addValue(text));
    }
    async getResults(): Promise<string[]> {
        await this.logMgr.info("getting text from 'SearchResults' to return as 'string[]'");
        let resultsText: string[] = [];

        var searchResults: ElementArray = await this._searchResults();
        for (var i=0; i<searchResults.length; i++) {
            let res: Element<'async'> = searchResults[i];
            let txt: string = await res.getText().catch(err => err);
            resultsText.push(txt);
        }
        await this.logMgr.info(`found results of: [${resultsText.join(', ')}]`);
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
    assert(contains); // throws on error
});
```
## aftconfig.json keys and values supported by aft-ui-mobile-apps package
- **browserstacksessiongeneratorplugin** - only required if referencing `browserstack-session-generator-plugin` in the `pluginNames` array of the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **user** - [REQUIRED] the BrowserStack username for the account to be used
  - **key** - [REQUIRED] the BrowserStack accesskey for the account to be used
  - **platform** - required if not set in the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **resolution** - a `string` containing a valid resolution for your BrowserStack session like: `1024x768` _(defaults to no value so BrowserStack will choose)_
  - **local** - a `boolean` value indicating if sessions should connect via an already running BrowserStack _Local_ VPN _(defaults to false)_
  - **localIdentifier** - a `string` containing the BrowserStack _Local_ `localIdentifier` to use when connecting to a _Local_ VPN instance. only required if **local** is set to `true` and your _Local_ VPN instance is using a `localIdentifier`
  - **url** - an alternative url for BrowserStack's grid hub _(defaults to `https://hub-cloud.browserstack.com/wd/hub/` if not specified)_
  - **capabilities** - an `object` containing keys and values to be used when creating your BrowserStack Session. this can be used to override default capabilities or to add additional ones _(defaults to none)_
- **saucelabssessiongeneratorplugin** - only required if referencing `saucelabs-session-generator-plugin` in the `pluginNames` array of the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **username** - [REQUIRED] the Sauce Labs username for the account to be used
  - **accesskey** - [REQUIRED] the Sauce Labs accesskey for the account to be used
  - **platform** - required if not set in the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **resolution** - a `string` containing a valid resolution for your Sauce Labs session like: `1024x768` _(defaults to no value so Sauce Labs will choose)_
  - **tunnel** - a `boolean` value indicating if sessions should connect via an already running Sauce Labs tunnel VPN _(defaults to false)_
  - **tunnelId** - a `string` containing the Sauce Labs `tunnelIdentifier` to use when connecting to a tunnel VPN instance. only required if **tunnel** is set to `true` and your tunnel VPN instance is using a `tunnelIdentifier`
  - **url** - an alternative url for Sauce Labs' grid hub _(defaults to `https://ondemand.us-east-1.saucelabs.com/wd/hub/` if not specified)_
  - **capabilities** - an `object` containing keys and values to be used when creating your Sauce Labs Session. this can be used to override default capabilities or to add additional ones _(defaults to none)_
- **seleniumgridsessiongeneratorplugin** - only required if referencing `selenium-grid-session-generator-plugin` in the `pluginNames` array of the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **platform** - required if not set in the `sessiongeneratorpluginmanager` section of your `aftconfig.json` file
  - **url** - [REQUIRED] the url of your running Selenium Grid instance
  - **capabilities** - an `object` containing keys and values to be used when creating your Browser Session