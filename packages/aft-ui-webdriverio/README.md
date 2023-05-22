# AFT-UI-WEBDRIVERIO
Automated Functional Testing (AFT) package providing WebdriverIO-based `WebdriverIoComponent extends UiComponent` class for use with POM-based UI testing strategies as well as `UiSessionGeneratorPlugin` implementations for connecting to WebdriverIO's Browser instance.

## Installation
`> npm i aft-ui-webdriverio`

## Creating your own Components for use in testing
Take the following as an example of how one could interact with the following Android App

### Step 1: create the View Component

```typescript
// wikipedia-view.ts
export class WikipediaView extends WebdriverIoComponent {
    override get locator(): string {
        return '//*';
    }
    private get _searchButton() { return this.getRoot().then(r => r.$("~Search Wikipedia")); }
    private get _searchInput() { return this.driver.$('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")'); }
    private get _searchResults() { return this.getRoot().then(r => r.$$("android.widget.TextView")); }
    async searchFor(term: string): Promise<string[]> {
        await this.reporter.info("tapping on 'SearchButton'...");
        await this._searchButton.then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }
    async sendTextToSearch(text: string): Promise<void> {
        await this.reporter.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput.then(i => i.addValue(text));
    }
    async getResults(): Promise<string[]> {
        await this.reporter.info("getting text from 'SearchResults' to return as 'string[]'");
        const resultsText = new Array<string>();
        const searchResults = await this._searchResults;
        for (var i=0; i<searchResults.length; i++) {
            let res = searchResults[i];
            let txt: string = await res.getText().catch(err => null);
            if (txt) { resultsText.push(txt); }
        }
        await this.reporter.info(`found results of: [${resultsText.join(', ')}]`);
        return resultsText;
    }
}
```
### Step 2: use them to interact with the mobile application

```typescript
// wikipedia-app.spec.ts
await verifyWithWebdriverIO(async (v: WebdriverIoVerifier) => {
    await v.reporter.step('get the WikipediaView Facet from the Session...');
    let view: WikipediaView = v.getComponent(WikipediaView);
    await v.reporter.step('enter a search term...');
    await view.searchFor('pizza');
    await v.reporter.step('get the results and ensure they contain the search term...');
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
}).returns(true); // if no results contained the word 'pizza' test fails
```
## aftconfig.json keys and values supported by aft-ui-webdriverio package
this package does not support any additional configuration. see [aft-ui](../aft-ui/README.md#aftconfigjson-keys-and-values-supported-by-aft-selenium-package) for values relevant in the `UiSessionConfig`