import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPluginManager, ISessionGeneratorPluginManagerOptions } from "aft-ui";
import { BrowserSession, BrowserSessionOptions } from "./browser-session";
import { AbstractBrowserGridSessionGeneratorPlugin } from "./selenium-grid/abstract-browser-grid-session-generator-plugin";

export interface BrowserSessionGeneratorPluginManagerOptions extends ISessionGeneratorPluginManagerOptions {

}

export class BrowserSessionGeneratorPluginManager extends AbstractSessionGeneratorPluginManager<AbstractBrowserGridSessionGeneratorPlugin, BrowserSessionGeneratorPluginManagerOptions> {
    constructor(options?: BrowserSessionGeneratorPluginManagerOptions) {
        super(nameof(BrowserSessionGeneratorPluginManager).toLowerCase(), options);
    }

    async newSession(options?: BrowserSessionOptions): Promise<BrowserSession> {
        return await this.getFirstEnabledPlugin()
        .then((plugin) => {
            return plugin.newSession(options);
        });
    }
}

export module BrowserSessionGeneratorPluginManager {
    var _inst: BrowserSessionGeneratorPluginManager;

    export function instance(): BrowserSessionGeneratorPluginManager {
        if (!_inst) {
            _inst = new BrowserSessionGeneratorPluginManager();
        }
        return _inst;
    }
}