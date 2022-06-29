import { BuildInfoManager, convert, machineInfo, MachineInfoData } from "../../../src";

describe('BuildInfoManager', () => {
    it('can load a specified BuildInfoPlugin', async () => {
        const manager: BuildInfoManager = new BuildInfoManager({
            plugins: ['mock-build-info-plugin']
        });
        const actual = await manager.plugins();
        
        expect(actual).toBeDefined();
        expect(actual.length).toBe(1);
        expect(actual[0].constructor.name).toBe('MockBuildInfoPlugin');
        expect(actual[0].enabled).toBe(true);
        expect(await actual[0].buildName()).toMatch(/MockBuildName-[0-9]{1,2}/);
        expect(await actual[0].buildNumber()).toMatch(/MockBuildNumber-[0-9]{3}/);
    });

    it('returns the build name from the first enabled plugin', async () => {
        const mgr: BuildInfoManager = new BuildInfoManager({
            plugins: ['mock-build-info-plugin']
        });

        expect(await mgr.buildName()).toMatch(/MockBuildName-[0-9]{1,2}/);
    });

    it('returns the build number from the first enabled plugin', async () => {
        let mgr: BuildInfoManager = new BuildInfoManager({
            plugins: ['mock-build-info-plugin']
        });

        expect(await mgr.buildNumber()).toMatch(/MockBuildNumber-[0-9]{3}/);
    });

    it('will generate a string based on the machine user and name if no BuildInfoPlugin available', async () => {
        const mgr: BuildInfoManager = new BuildInfoManager();
        const actual: string = await mgr.get();
        const mi: MachineInfoData = machineInfo.data;

        expect(actual).withContext('is valid string').toBeDefined();
        const safeStr = [{exclude: /[\()\;\\\/\|\<\>""'*&^%$#@!,.\-\+_=\?]/gi, replaceWith: ''}];
        expect(actual).withContext('machineName').toContain(convert.toSafeString(mi.hostname, safeStr));
        expect(actual).withContext('machineUser').toContain(convert.toSafeString(mi.user, safeStr));
    });

    it('will generate a string based on the plugin if a BuildInfoPlugin is available', async () => {
        const mgr: BuildInfoManager = new BuildInfoManager({
            plugins: ['mock-build-info-plugin']
        });
        const actual: string = await mgr.get();
        const mi: MachineInfoData = machineInfo.data;

        expect(actual).withContext('is valid string').toBeDefined();
        expect(actual).withContext('machineName').not.toContain(mi.hostname);
        expect(actual).withContext('machineUser').not.toContain(mi.user);
    });
});