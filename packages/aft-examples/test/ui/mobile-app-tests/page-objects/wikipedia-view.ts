import { SeleniumComponent } from "aft-ui-selenium";
import { By, Locator, WebElement } from "selenium-webdriver";

export class WikipediaView extends SeleniumComponent {
    override get locator(): Locator {
        return By.xpath('//*');
    }

    private _searchButton = async (): Promise<WebElement> => (await this.getRoot()).findElement(By.js("~Search Wikipedia"));
    private _searchInput = async (): Promise<WebElement> => await this.driver.findElement(By.js('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")'));
    private _searchResults = async (): Promise<Array<WebElement>> => (await this.getRoot()).findElements(By.js("android.widget.TextView"));

    async searchFor(term: string): Promise<string[]> {
        await this.logMgr.info("tapping on 'SearchButton'");
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }

    async sendTextToSearch(text: string): Promise<void> {
        await this.logMgr.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput().then(i => i.sendKeys(text));
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