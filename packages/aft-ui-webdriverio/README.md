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
// wikipedia-app.spec.ts mocha test using AftMochaReporter
describe('WebdriverIoSession', () => {
    it('[C1234] can access mobile apps using AFT and UiComponents with AftMochaTest', async function() {
        await aftMochaTest(this, async (v: AftMochaTest) => {
            const lowercaseResults = new Array<string>();
            await using(new WebdriverIoSession({reporter: v.reporter}), async (session) => {
                await session.reporter.step('get the WikipediaView Facet from the Session...');
                const view: WikipediaView = await session.getComponent(WikipediaView);
                await session.reporter.step('enter a search term...');
                await view.searchFor('pizza');
                await session.reporter.step('get the results and ensure they contain the search term...');
                const results: string[] = await view.getResults();

                lowercaseResults.push(...results);
            });
            await v.verify(lowercaseResults, containing('pizza')); // if no results contained the word 'pizza' test fails
        }); 
    })

    it('[C2345] can access mobile apps using AFT and UiComponents with AftMochaReporter', async function() {
        const aft = new AftMochaTest(this);
        if (!(await aft.shouldRun())) {
            await aft.pending();
        } else {
            await using(new WebdriverIoSession({reporter: aft.reporter}), async (session) => {
                await session.reporter.step('get the WikipediaView Facet from the Session...');
                const view: WikipediaView = await session.getComponent(WikipediaView);
                await session.reporter.step('enter a search term...');
                await view.searchFor('pizza');
                await session.reporter.step('get the results and ensure they contain the search term...');
                const results: string[] = await view.getResults();

                expect(results.some(item => item.includes('pizza'))).to.eql(true);
            });
        }
    })
})
```
## aftconfig.json keys and values supported by aft-ui-webdriverio package
this package does not support any additional configuration. see [aft-ui](../aft-ui/README.md#aftconfigjson-keys-and-values-supported-by-aft-ui-selenium-package) for values relevant in the `UiSessionConfig`