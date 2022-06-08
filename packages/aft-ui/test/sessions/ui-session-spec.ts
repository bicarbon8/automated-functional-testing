import { FakeFacet, FakeFacetOptions } from "../facets/fake-facet";
import { FakeLocator } from "../facets/fake-locator";
import { FakeDriver } from "./fake-driver";
import { FakeSession, FakeSessionOptions } from "./fake-session";

describe('UiSession', () => {
    it('can be overridden to return specified UiFacet types', async () => {
        const fakeDriver = new FakeDriver();
        const options = {
            driver: fakeDriver,
        } as FakeSessionOptions;
        const session = new FakeSession(options);

        const actual = await session.getFacet<FakeFacet, FakeFacetOptions>(FakeFacet, {locator: FakeLocator.css('fake:loc')});

        expect(actual).toBeDefined();
        expect(actual.constructor.name).toEqual('FakeFacet');
        expect(actual.session).toBe(session);
        expect(actual.locator).toBeDefined();
        expect(actual.logMgr).toBe(session.logMgr);
        expect(actual.index).toBe(0);
    });
});