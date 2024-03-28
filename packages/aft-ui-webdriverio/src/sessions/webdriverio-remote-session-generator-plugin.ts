import { UiSessionGeneratorPlugin } from "aft-ui";
import { remote, RemoteOptions } from "webdriverio";

export class WebdriverIoRemoteSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async(options?: Record<string, any>): Promise<WebdriverIO.Browser> => { // eslint-disable-line no-undef
        const ro: RemoteOptions = {...options} as RemoteOptions;
        let browser: WebdriverIO.Browser; // eslint-disable-line no-undef
        try {
            browser = await remote(ro);
        } catch (e) {
            this.aftLogger.log({name: this.constructor.name, level: 'error', message: e});
        }
        return browser;
    }
}