import { WebdriverIoComponent } from "aft-ui-webdriverio";

export class WikipediaView extends WebdriverIoComponent {
    override get locator(): string {
        return '//*';
    }

    private _searchButton = async (): Promise<WebdriverIO.Element> => await (await this.getRoot()).$("~Search Wikipedia");
    private _searchInput = async (): Promise<WebdriverIO.Element> => await this.driver.$('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")');
    private _searchResults = async (): Promise<WebdriverIO.ElementArray> => await (await this.getRoot()).$$("android.widget.TextView");

    async searchFor(term: string): Promise<string[]> {
        await this.reporter.info("tapping on 'SearchButton'");
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }

    async sendTextToSearch(text: string): Promise<void> {
        await this.reporter.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput().then(i => i.addValue(text));
    }

    async getResults(): Promise<string[]> {
        await this.reporter.info("getting text from 'SearchResults' to return as 'string[]'");
        let resultsText: string[] = [];

        var searchResults = await this._searchResults();
        for (var i=0; i<searchResults.length; i++) {
            let res = searchResults[i];
            let txt: string = await res.getText().catch(err => err);
            resultsText.push(txt);
        }
        await this.reporter.info(`found results of: [${resultsText.join(', ')}]`);
        return resultsText;
    }
}