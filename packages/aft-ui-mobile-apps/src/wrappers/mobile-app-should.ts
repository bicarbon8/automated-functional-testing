import { ProcessingResult } from "aft-core";
import { MobileAppTestWrapper, MobileAppTestWrapperOptions } from "./mobile-app-test-wrapper";

/**
 * function creates a new {BrowserTestWrapper} that can be used like:
 * ```
 * await mobileAppShould({expect: async (tw) => {
 *     let facet: SeleniumFacet = await tw.session.getFacet(SeleniumFacet, {locator: By.css('div.foo')}); 
 *     expect(await facet.getRoot().getText()).toEqual('foo text');
 * }});
 * await mobileAppShould({expect: () => expect(true).toBeTruthy(), description: 'expect true will always be truthy'});
 * await mobileAppShould({expect: () => expect(false).toBeFalsy(), testCases: ['C1234'], description: 'expect false is always falsy'});
 * await mobileAppShould({expect: () => expect('foo').toBe('foo')});
 * ```
 * @param options a {BrowserTestWrapperOptions} object containing the expectation and other options
 */
 export const mobileAppShould = async function(options: MobileAppTestWrapperOptions): Promise<ProcessingResult> {
    let t: MobileAppTestWrapper = new MobileAppTestWrapper(options);
    return await t.run();
}