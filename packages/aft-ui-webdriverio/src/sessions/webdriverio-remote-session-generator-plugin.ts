import { LogManager } from "aft-core";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { Browser, remote, RemoteOptions } from "webdriverio";

export class WebdriverIoRemoteSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async(options?: Record<string, any>): Promise<Browser<'async'>> => {
        const ro: RemoteOptions = {...options} as RemoteOptions;
        let browser: Browser<'async'>; 
        try {
            browser = await remote(ro);
        } catch (e) {
            LogManager.toConsole({name: this.constructor.name, level: 'error', message: e});
        }
        return browser;
    }
}