import { Func, ProcessingResult, TestWrapper, TestWrapperOptions, using } from "aft-core";
import { BrowserSession, BrowserSessionOptions } from "../sessions/browser-session";
import { BrowserSessionGeneratorPluginManager } from "../sessions/browser-session-generator-plugin-manager";

export interface BrowserTestWrapperOptions extends TestWrapperOptions, BrowserSessionOptions {
    expectation: Func<BrowserTestWrapper, any>;

    /**
     * [OPTIONAL] if not passed in the {SessionPluginManager.instance()}
     * will be used instead
     */
    _sessionGenPluginMgr?: BrowserSessionGeneratorPluginManager;
}

/**
 * provides pre-test execution filtering based on specified 
 * test IDs or defect IDs and post-test results logging. usage
 * is intended to be managed through the `browserShould(expectation, options)`
 * function via:
 * ```
 * browserShould({
 *     expect: async (tw) => {
 *         let facet: BrowserFacet = await tw.session.getFacet(BrowserFacet, {locator: By.css('div.foo')});
 *         let element: WebElement = await facet.getRoot();
 *         return await element.isDisplayed();
 *     }, 
 *     description: 'expect can start a browser session and get the root element from a Facet'
 * });
 * ```
 */
export class BrowserTestWrapper extends TestWrapper {
    private readonly _options: BrowserTestWrapperOptions;
    private readonly _sessionGenPluginMgr: BrowserSessionGeneratorPluginManager;

    private _session: BrowserSession;

    constructor(options: BrowserTestWrapperOptions) {
        super(options);
        this._options = options;
        this._sessionGenPluginMgr = this._initialiseSessionPluginManager(options);
    }

    /**
     * only valid for use during execution of the {run} function;
     * this will return an instance of {ISession}
     * for use by the executing {expectation}
     */
    get session(): BrowserSession {
        return this._session;
    }

    /**
     * checks if the expectation should be executed and if so runs it
     * and returns the result via an {ProcessingResult}
     * usage:
     * ```
     * let tw: BrowserTestWrapper = new BrowserTestWrapper();
     * // starts a new Browser Session and runs the Expectation
     * await tw.run({ expect: async (t) => {
     *     let facet: SeleniumFacet = await t.session.getFacet(SeleniumFacet, {locator: By.css('html')});
     *     return expect(await facet.getRoot().then((r) => r.getText())).toEqual('foo');
     * }});
     * ```
     * @returns a {ProcessingResult} specifying the result of execution of
     * the passed in expectation
     */
    async run(): Promise<ProcessingResult> {
        let result: ProcessingResult;
        
        this._options.logMgr = this.logMgr;
        await using(await this._sessionGenPluginMgr.newSession(this._options), async (session) => {
            this._session = session;
            result = await super.run();
        });

        return result;
    }

    private _initialiseSessionPluginManager(options: BrowserTestWrapperOptions): BrowserSessionGeneratorPluginManager {
        return options._sessionGenPluginMgr || BrowserSessionGeneratorPluginManager.instance();
    }
}