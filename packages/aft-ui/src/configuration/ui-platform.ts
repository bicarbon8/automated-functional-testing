export type UiTestPlatformOptions = {
    os?: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
    deviceName?: string;
};

export class UiPlatform {
    static ANY: string = '+';

    readonly os: string;
    readonly osVersion: string;
    readonly browser: string;
    readonly browserVersion: string;
    readonly deviceName: string;
    
    constructor(options?: UiTestPlatformOptions) {
        this.os = options?.os;
        this.osVersion = options?.osVersion;
        this.browser = options?.browser;
        this.browserVersion = options?.browserVersion;
        this.deviceName = options?.deviceName;
    }

    toString(): string {
        let str: string = '';
        str += (this.os) ? this.os : UiPlatform.ANY;
        str += '_';
        str += (this.osVersion) ? this.osVersion : UiPlatform.ANY;
        str += '_';
        str += (this.browser) ? this.browser : UiPlatform.ANY;
        str += '_';
        str += (this.browserVersion) ? this.browserVersion : UiPlatform.ANY;
        str += '_';
        str += (this.deviceName) ? this.deviceName : UiPlatform.ANY;
        return str;
    }

    static parse(input: string): UiPlatform {
        let os: string;
        let osVer: string;
        let browser: string;
        let browserVer: string;
        let devName: string;
        
        if (input) {
            let parts: string[] = input.split('_');
            if (parts.length > 0) {
                os = (parts[0] != UiPlatform.ANY) ? parts[0] : null;
            }
            if (parts.length > 1) {
                osVer = (parts[1] != UiPlatform.ANY) ? parts[1] : null;
            }
            if (parts.length > 2) {
                browser = (parts[2] != UiPlatform.ANY) ? parts[2] : null;
            }
            if (parts.length > 3) {
                browserVer = (parts[3] != UiPlatform.ANY) ? parts[3] : null;
            }
            if (parts.length > 4) {
                devName = (parts[4] != UiPlatform.ANY) ? parts[4] : null;
            }
        }

        return new UiPlatform({os: os, osVersion: osVer, browser: browser, browserVersion: browserVer, deviceName: devName});
    }
}