import { DefectManager, DefectPlugin } from "../../../src";

describe('DefectManager', () => {
    it('can load a specified IDefectPlugin implementation', async () => {
        let dpm: DefectManager = new DefectManager({pluginNames: ['mock-defect-plugin']});
        let actual: DefectPlugin[] = await dpm.getPlugins();

        expect(actual).withContext('an array of plugins should be returned').toBeDefined();
        expect(actual.length).withContext('there should be at least 1 plugin').toBeGreaterThan(0);
        expect(await actual[0].enabled()).withContext('plugin should be enabled').toBeTruthy();
        expect(actual[0].optionsMgr.key).withContext('plugin should be instance of MockDefectPlugin').toEqual('mockdefectplugin');
    });
});