import { WebdriverIoComponent } from "aft-ui-webdriverio";
import { Element } from "webdriverio";

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