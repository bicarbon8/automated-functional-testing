import { BuildInfoManager, BuildInfoPlugin, MachineInfo, MachineInfoData } from "../../../src";

describe('BuildInfoPluginManager', () => {
    it('assigns a configuration key based on the class name', () => {
        let mgr: BuildInfoManager = new BuildInfoManager();
        let actual: string = mgr.optionsMgr.key;

        expect(actual).toEqual('buildinfomanager');
    });
    
    it('can load a specified BuildInfoPlugin', async () => {
        let manager: BuildInfoManager = new BuildInfoManager({pluginNames: ['mock-build-info-plugin']});
        let actual: BuildInfoPlugin[] = await manager.getPlugins();
        
        expect(actual).toBeDefined();
        expect(actual.length).toBeGreaterThan(0);
        expect(actual[0].optionsMgr.key).toBe('mockbuildinfoplugin');
        expect(await actual[0].getBuildName()).toMatch(/MockBuildName-[0-9]{1,2}/);
        expect(await actual[0].getBuildNumber()).toMatch(/MockBuildNumber-[0-9]{3}/);
    });

    it('returns the build name from the first enabled plugin', async () => {
        let mgr: BuildInfoManager = new BuildInfoManager({pluginNames: ['mock-build-info-plugin']});

        expect(await mgr.getBuildName()).toMatch(/MockBuildName-[0-9]{1,2}/);
    });

    it('returns the build number from the first enabled plugin', async () => {
        let mgr: BuildInfoManager = new BuildInfoManager({pluginNames: ['mock-build-info-plugin']});

        expect(await mgr.getBuildNumber()).toMatch(/MockBuildNumber-[0-9]{3}/);
    });

    it('will generate a string based on the machine user and name if no BuildInfoPlugin available', async () => {
        let mgr: BuildInfoManager = new BuildInfoManager({pluginNames: []});
        const actual: string = await mgr.get();
        const mi: MachineInfoData = await MachineInfo.get();

        expect(actual).withContext('is valid string').toBeDefined();
        expect(actual).withContext('machineName').toContain(mi.name);
        expect(actual).withContext('machineUser').toContain(mi.user);
    });

    it('will generate a string based on the plugin if a BuildInfoPlugin is available', async () => {
        let mgr: BuildInfoManager = new BuildInfoManager({pluginNames: ['mock-build-info-plugin']});
        const actual: string = await mgr.get();
        const mi: MachineInfoData = await MachineInfo.get();

        expect(actual).withContext('is valid string').toBeDefined();
        expect(actual).withContext('machineName').not.toContain(mi.name);
        expect(actual).withContext('machineUser').not.toContain(mi.user);
    });
});