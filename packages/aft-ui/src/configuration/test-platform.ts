export interface TestPlatformOptions {
    os?: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
    deviceName?: string;
}

export class TestPlatform {
    static ANY: string = '+';

    readonly os: string;
    readonly osVersion: string;
    readonly browser: string;
    readonly browserVersion: string;
    readonly deviceName: string;
    
    constructor(options?: TestPlatformOptions) {
        this.os = options?.os;
        this.osVersion = options?.osVersion;
        this.browser = options?.browser;
        this.browserVersion = options?.browserVersion;
        this.deviceName = options?.deviceName;
    }

    toString(): string {
        let str: string = '';
        str += (this.os) ? this.os : TestPlatform.ANY;
        str += '_';
        str += (this.osVersion) ? this.osVersion : TestPlatform.ANY;
        str += '_';
        str += (this.browser) ? this.browser : TestPlatform.ANY;
        str += '_';
        str += (this.browserVersion) ? this.browserVersion : TestPlatform.ANY;
        str += '_';
        str += (this.deviceName) ? this.deviceName : TestPlatform.ANY;
        return str;
    }

    static parse(input: string): TestPlatform {
        let os: string;
        let osVer: string;
        let browser: string;
        let browserVer: string;
        let devName: string;

        if (input) {
            let parts: string[] = input.split('_');
            if (parts.length > 0) {
                os = (parts[0] != TestPlatform.ANY) ? parts[0] : null;
            }
            if (parts.length > 1) {
                osVer = (parts[1] != TestPlatform.ANY) ? parts[1] : null;
            }
            if (parts.length > 2) {
                browser = (parts[2] != TestPlatform.ANY) ? parts[2] : null;
            }
            if (parts.length > 3) {
                browserVer = (parts[3] != TestPlatform.ANY) ? parts[3] : null;
            }
            if (parts.length > 4) {
                devName = (parts[4] != TestPlatform.ANY) ? parts[4] : null;
            }
        }

        return new TestPlatform({os: os, osVersion: osVer, browser: browser, browserVersion: browserVer, deviceName: devName});
    }
}