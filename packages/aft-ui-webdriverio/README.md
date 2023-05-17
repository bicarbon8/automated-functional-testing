# AFT-UI-Mobile-Apps
Automated Functional Testing (AFT) package providing Appium-based `MobileAppFacet extends UiFacet` Plugins and BrowserStack, Sauce Labs and Appium Grid `UiSession` Plugins extending the `aft-ui` package. This enables testing using BrowserStack's, Sauce Labs's or a Local Selenium Grid for any Mobile Device application tests.

## Installation
`> npm i aft-ui-mobile-apps`

## Creating your own Components for use in testing
Take the following as an example of how one could interact with the following Android App

### Step 1: create the View Component

```typescript
// wikipedia-view.ts
export class WikipediaView extends WebdriverIoComponent {
    override get locator(): string {
        return '//*';
    }
    private _searchButton = async (): Promise<Element<'async'>> => await (await this.getRoot()).$("~Search Wikipedia");
    private _searchInput = async (): Promise<Element<'async'>> => await this.driver.$('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")');
    private _searchResults = async (): Promise<Array<Element<'async'>>> => await (await this.getRoot()).$$("android.widget.TextView");
    async searchFor(term: string): Promise<string[]> {
        await this.logMgr.info("tapping on 'SearchButton'");
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }
    async sendTextToSearch(text: string): Promise<void> {
        await this.logMgr.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput().then(i => i.addValue(text));
    }
    async getResults(): Promise<string[]> {
        await this.logMgr.info("getting text from 'SearchResults' to return as 'string[]'");
        let resultsText: string[] = [];

        var searchResults = await this._searchResults();
        for (var i=0; i<searchResults.length; i++) {
            let res = searchResults[i];
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
// wikipedia-app.spec.ts
await verifyWithWebdriverIO(async (v: WebdriverIoVerifier) => {
    await v.logMgr.step('get the WikipediaView Facet from the Session...');
    let view: WikipediaView = v.getComponent(WikipediaView);
    await v.logMgr.step('enter a search term...');
    await view.searchFor('pizza');
    await v.logMgr.step('get the results and ensure they contain the search term...');
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
## aftconfig.json keys and values supported by aft-ui-webdriverio package
this package does not support any additional configuration. see [aft-ui](../aft-ui/README.md#aftconfigjson-keys-and-values-supported-by-aft-selenium-package) for values relevant in the `UiSessionConfig`