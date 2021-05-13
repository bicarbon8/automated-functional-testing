import { MobileAppFacet } from "aft-ui-mobile-apps";
import { Element, ElementArray } from "webdriverio";

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