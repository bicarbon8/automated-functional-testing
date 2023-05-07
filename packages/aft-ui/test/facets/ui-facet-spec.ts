import { AftLog, rand } from "aft-core";
import { FakeDriver } from "../sessions/fake-driver";
import { FakeSession } from "../sessions/fake-session";
import { FakeFacet, FakeFacetOptions } from "./fake-facet";
import { FakeLocator } from "./fake-locator";

describe('UiFacet<T>', () => {
    it('can be extended to return specific UiFacet types', async () => {
        const options = {
            session: new FakeSession({driver: new FakeDriver()}),
            index: 0,
            locator: FakeLocator.css('fake:loc'),
            logMgr: new AftLog({logName: rand.getString(15)})
        } as FakeFacetOptions;
        const facet = new FakeFacet(options);

        const actual = await facet.getFacet<FakeFacet>(FakeFacet, {index: 12, locator: FakeLocator.css('new:loc')});

        expect(actual).toBeDefined();
        expect(actual.index).toBe(12);
        expect(actual.locator).toEqual(FakeLocator.css('new:loc'));
        expect(actual.parent).toBe(facet);
        expect(actual.session).toBe(facet.session);
        expect(actual.logMgr).toBe(facet.logMgr);
    });
});