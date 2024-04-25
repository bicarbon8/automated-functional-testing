import { WebdriverIoComponent } from "aft-ui-webdriverio";

export class WikipediaView extends WebdriverIoComponent {
    override get locator(): string {
        return '//*';
    }

    private async _searchButton(): Promise<WebdriverIO.Element> {
        return this.getRoot().then(r => r.$("~Search Wikipedia"));
    }

    private async _searchInput(): Promise<WebdriverIO.Element> {
        return this.driver.$('android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")');
    }

    private async _searchResults(): Promise<WebdriverIO.ElementArray> {
        return this.getRoot().then(r => r.$$("android.widget.TextView"));
    }

    async searchFor(term: string): Promise<string[]> {
        await this.reporter.info("tapping on 'SearchButton'");
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return this.getResults();
    }

    async sendTextToSearch(text: string): Promise<void> {
        await this.reporter.info(`setting 'SearchInput' to '${text}'...`);
        await this._searchInput().then(i => i.addValue(text));
    }

    async getResults(): Promise<string[]> {
        await this.reporter.info("getting text from 'SearchResults' to return as 'string[]'");
        const resultsText: string[] = [];

        const searchResults = await this._searchResults();
        for (const res of searchResults) {
            const txt: string = await res.getText().catch(err => err);
            resultsText.push(txt);
        }
        await this.reporter.info(`found results of: [${resultsText.join(', ')}]`);
        return resultsText;
    }
}