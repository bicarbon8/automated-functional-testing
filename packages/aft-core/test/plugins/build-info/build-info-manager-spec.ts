import { BuildInfoManager, BuildInfoPlugin } from "../../../src";

describe('BuildInfoPluginManager', () => {
    it('assigns a configuration key based on the class name', () => {
        let mgr: BuildInfoManager = new BuildInfoManager();
        let actual: string = mgr.optionsMgr.key;

        expect(actual).toEqual('buildinfomanager');
    });
    
    it('can load a specified IBuildInfoHandlerPlugin', async () => {
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
});