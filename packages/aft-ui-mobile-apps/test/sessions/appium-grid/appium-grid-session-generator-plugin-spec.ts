import { rand } from "aft-core";
import { UiPlatform } from "aft-ui";
import { RemoteOptions } from "webdriverio";
import { AppiumGridSessionGeneratorPlugin } from "../../../src";

describe('AppiumGridSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in options', async () => {
        let platform: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true)
        });
        let plugin: AppiumGridSessionGeneratorPlugin = new AppiumGridSessionGeneratorPlugin({
            uiplatform: platform.toString()
        });
        let remOpts: RemoteOptions = await plugin.generateRemoteOptions();

        expect(remOpts.capabilities['platform']).toEqual(`${platform.os} ${platform.osVersion}`);
        expect(remOpts.capabilities['browserName']).not.toBeDefined();
    });
});