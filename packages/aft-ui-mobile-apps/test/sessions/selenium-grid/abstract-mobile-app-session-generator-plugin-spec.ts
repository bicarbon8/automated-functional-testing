import { nameof } from "ts-simple-nameof";
import { rand } from "aft-core";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../../../src";
import { RemoteOptions } from "webdriverio";
import { MobileAppCommand, MobileAppCommandResponse } from "../../../src/sessions/mobile-app-command";

describe('AbstractMobileAppGridSessionGeneratorPlugin', () => {
    beforeEach(() => {
        jasmine.getEnv().allowRespy(true);
    });
    
    it('can generate capabilities from the passed in SessionOptions', async () => {
        let caps: {} = {
            'custom1': `custom1-${rand.getString(10)}`,
            'custom2': `custom2-${rand.getString(10)}`,
            'custom3': `custom3-${rand.getString(10)}`,
            'custom4': `custom4-${rand.getString(10)}`
        };
        let session: FakeMobileAppSessionGeneratorPlugin = new FakeMobileAppSessionGeneratorPlugin({remoteOptions: {capabilities: caps}});
        let actual: RemoteOptions = await session.getRemoteOptions();

        for (var prop in caps) {
            expect(actual.capabilities[prop]).toEqual(caps[prop]);
        }
    });
});

class FakeMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    constructor(options?: MobileAppSessionGeneratorPluginOptions) {
        super(nameof(FakeMobileAppSessionGeneratorPlugin).toLowerCase(), options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
    async sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse> {
        /* do nothing */
        return null;
    }
}