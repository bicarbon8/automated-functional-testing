import { TestPlatform } from "../../src/configuration/test-platform";

describe('TestPlatform', () => {
    it('can parse a valid platform string', async () => {
        let platformString: string = 'windows_10_chrome_76_Google Pixel 3';
        let platform: TestPlatform = TestPlatform.parse(platformString);

        expect(platform).not.toBeUndefined();
        expect(platform.os).toEqual('windows');
        expect(platform.osVersion).toEqual('10');
        expect(platform.browser).toEqual('chrome');
        expect(platform.browserVersion).toEqual('76');
        expect(platform.deviceName).toEqual('Google Pixel 3');
    });

    it('can generate a valid platform string', async () => {
        let platform: TestPlatform = new TestPlatform({os:'mac', osVersion:'osx', browser:'firefox', browserVersion:'34', deviceName:'Samsung Galaxy S3'});
        let platformString: string = platform.toString();

        expect(platformString).toEqual('mac_osx_firefox_34_Samsung Galaxy S3');
    });
});