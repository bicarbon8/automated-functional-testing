import { UiPlatform } from "../../src/configuration/ui-platform";

describe('UiTestPlatform', () => {
    const data: {plt: string, os?: string, osVersion?: string, browser?: string, browserVersion?: string, deviceName?: string}[] = [
        {plt: 'android_11_+_+_Samsung Galaxy S3', os: 'android', osVersion: '11', browser: null, browserVersion: null, deviceName: 'Samsung Galaxy S3'},
        {plt: 'windows_10_chrome_76_Google Pixel 3', os: 'windows', osVersion: '10', browser: 'chrome', browserVersion: '76', deviceName: 'Google Pixel 3'},
        {plt: 'mac_osx_+_+_+', os: 'mac', osVersion: 'osx', browser: null, browserVersion: null, deviceName: null}
    ];

    for (var i=0; i<data.length; i++) {
        let d = data[i];
        it(`can parse a valid platform string of '${d.plt}'`, () => {
            const platform: UiPlatform = UiPlatform.parse(d.plt);

            expect(platform).withContext('object').not.toBeUndefined();
            expect(platform.os).withContext('os').toEqual(d.os);
            expect(platform.osVersion).withContext('os version').toEqual(d.osVersion);
            expect(platform.browser).withContext('browser').toEqual(d.browser);
            expect(platform.browserVersion).withContext('browser version').toEqual(d.browserVersion);
            expect(platform.deviceName).withContext('device name').toEqual(d.deviceName);
        });
    }

    for (var i=0; i<data.length; i++) {
        let d = data[i];
        it(`can generate a valid platform string from os '${d.os}'`, () => {
            const platform: UiPlatform = new UiPlatform({
                os: d.os, 
                osVersion: d.osVersion, 
                browser: d.browser, 
                browserVersion: d.browserVersion, 
                deviceName: d.deviceName
            });
            let platformString: string = platform.toString();

            expect(platformString).toEqual(d.plt);
        });
    }

    it('can use UiTestPlatform.ANY as options input', () => {
        const platform: UiPlatform = new UiPlatform({
            os: UiPlatform.ANY, 
            osVersion: UiPlatform.ANY, 
            browser: UiPlatform.ANY, 
            browserVersion: UiPlatform.ANY, 
            deviceName: UiPlatform.ANY
        });
        let platformString: string = platform.toString();

        expect(platformString).toEqual('+_+_+_+_+');
    });
});