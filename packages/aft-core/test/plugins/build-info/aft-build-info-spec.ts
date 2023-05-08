import { AftBuildInfo, AftConfig, convert, machineInfo, MachineInfoData, pluginLoader, rand } from "../../../src";

describe('AftBuildInfo', () => {
    afterEach(() => {
        pluginLoader.reset();
    })

    it('can load expected plugin', async () => {
        const randomName = rand.getString(12);
        const actual = new AftBuildInfo(new AftConfig({
            pluginNames: ['mock-build-info-plugin'],
            MockBuildInfoPluginConfig: {
                enabled: true,
                buildName: randomName,
                buildNumberMin: 100,
                buildNumberMax: 999
            }
        }));
        
        expect(actual).toBeDefined();
        expect(actual.plugins.length).toBe(1);
        expect(actual.plugins[0].constructor.name).toBe('MockBuildInfoPlugin');
        expect(actual.plugins[0].enabled).toBe(true);
        expect(await actual.plugins[0].buildName()).toEqual(`MockBuildName-${randomName}`);
        expect(await actual.plugins[0].buildNumber()).toMatch(/MockBuildNumber-[0-9]{3}/);
    });

    it('will generate a string based on the machine user and name if no BuildInfoPlugin available', async () => {
        const mgr: AftBuildInfo = new AftBuildInfo();
        const actual: string = await mgr.get();
        const mi: MachineInfoData = machineInfo.data;

        expect(actual).withContext('is valid string').toBeDefined();
        const safeStr = [{exclude: /[\()\;\\\/\|\<\>""'*&^%$#@!,.\-\+_=\?]/gi, replaceWith: ''}];
        expect(actual).withContext('machineName').toContain(convert.toSafeString(mi.hostname, safeStr).toLocaleUpperCase());
        expect(actual).withContext('machineUser').toContain(convert.toSafeString(mi.user, safeStr).toLocaleUpperCase());
    });

    it('will generate a string based on the plugin if a BuildInfoPlugin is available', async () => {
        const randomName = rand.getString(22);
        const mgr: AftBuildInfo = new AftBuildInfo(new AftConfig({
            pluginNames: ['mock-build-info-plugin'],
            MockBuildInfoPluginConfig: {
                enabled: true,
                buildName: randomName,
                buildNumberMin: 100,
                buildNumberMax: 999
            }
        }));
        const actual: string = await mgr.get();
        const mi: MachineInfoData = machineInfo.data;

        expect(actual).withContext('is valid string').toBeDefined();
        expect(actual).withContext('machineName').not.toContain(mi.hostname.toLocaleUpperCase());
        expect(actual).withContext('machineUser').not.toContain(mi.user.toLocaleUpperCase());
        expect(actual).withContext('buildName').toContain('MockBuildName-');
        expect(actual).withContext('buildNumber').toContain('MockBuildNumber-');
    });
});