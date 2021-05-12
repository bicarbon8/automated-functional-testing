import { MobileAppFacet } from "aft-ui-mobile-apps";
import { Element, ElementArray } from "webdriverio";

export class WikipediaView extends MobileAppFacet {
    readonly locator: string = '//*';

    private _searchButton = async (): Promise<Element<'async'>> => await this.getElement({locator: "~Search Wikipedia"});
    private _searchInput = async (): Promise<Element<'async'>> => await this.getElement({locator: 'android=new UiSelector().resourceId("org.wikipedia.alpha:id/search_src_text")'});

    async searchFor(term: string): Promise<string[]> {
        await this.logMgr.info("tapping on 'SearchButton'");
        await this._searchButton().then(b => b.click());
        await this.sendTextToSearch(term);
        return await this.getResults();
    }

    async getResults(): Promise<string[]> {
        await this.logMgr.info("getting text from 'SearchResults' to return as 'string[]'");
        let resultsText: string[] = [];

        var searchResults: ElementArray = await this.session.driver.$$("android.widget.TextView");
        searchResults.forEach(async (result: Element<'async'>) => {
            try {
                var resText = await result.getText();
                await this.logMgr.info(`found result of '${resText}'`);
                resultsText.push(resText);
            } catch (e) {
                /* ignore */
            }
        });
        return resultsText;
    }

    async sendTextToSearch(text: string): Promise<void> {
        await this.logMgr.info(`setting 'SearchInput' to '${text}'`);
        await this._searchInput().then(i => i.sendKeys(Array.from(text)));
    }
}