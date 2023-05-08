import { AftConfig, DefectManager } from "../../../src";

describe('DefectManager', () => {
    it('can load a specified DefectPlugin implementation', async () => {
        const dpm: DefectManager = new DefectManager(new AftConfig({
            pluginNames: ['mock-defect-plugin'],
            MockDefectPluginConfig: {
                enabled: true
            }
        }));
        const actual = dpm.plugins;

        expect(actual).withContext('an array of plugins should be returned').toBeDefined();
        expect(actual.length).withContext('there should be at least 1 plugin').toBe(1);
        expect(actual[0]).withContext('plugin should be defined').toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockDefectPlugin').toEqual('MockDefectPlugin');
    });
});